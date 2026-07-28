<?php

namespace Tests\Feature\Expense;

use App\Models\Expense;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Un justificatif de dépense ne se lit qu'avec un compte qui a accès à la boutique.
 *
 * Il vivait sur le disque `public` : `/storage/receipts/<nom>.jpg` rendait une facture
 * fournisseur — montants, nom du fournisseur, parfois un RIB — à qui connaissait l'adresse,
 * sans session. Le nom de fichier aléatoire retardait, ne protégeait pas.
 *
 * À ne pas confondre avec le reçu client envoyé par WhatsApp, qui est une page rendue derrière
 * un lien signé temporaire (App\Services\DocumentLink) et n'a jamais touché ce disque.
 */
class ReceiptAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::fake(Expense::RECEIPT_DISK);

        $this->owner = User::factory()->create(['role' => 'super_admin']);
        $this->shop = Shop::factory()->create(['user_id' => $this->owner->id]);
        $this->owner->update(['shop_id' => $this->shop->id]);
        $this->owner = $this->owner->fresh();
    }

    private function expenseWithReceipt(?Shop $shop = null): Expense
    {
        $shop ??= $this->shop;

        Storage::disk(Expense::RECEIPT_DISK)->put('receipts/justificatif.jpg', 'contenu');

        return Expense::factory()->create([
            'shop_id' => $shop->id,
            'user_id' => $shop->user_id,
            'receipt' => 'receipts/justificatif.jpg',
        ]);
    }

    /**
     * Le `code_user` est celui de l'appelant, jamais celui du propriétaire de la dépense.
     *
     * C'est la forme réelle d'un accès indu : un intrus reste sur sa propre URL de compte et
     * ne change que l'identifiant de la dépense. Signer l'URL avec le `code_user` de la
     * victime aurait fait rejeter la requête par le middleware de locataire, bien avant le
     * contrôleur — le test aurait été vert sans rien prouver du contrôle qu'il vise.
     */
    private function receiptUrl(Expense $expense, ?User $as = null): string
    {
        return route('expenses.receipt', [
            'code_user' => ($as ?? $this->owner)->code_user,
            'expense' => $expense->id,
        ]);
    }

    public function test_the_owner_can_read_their_own_receipt(): void
    {
        $expense = $this->expenseWithReceipt();

        $response = $this->actingAs($this->owner)->get($this->receiptUrl($expense));

        $response->assertOk();
        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
    }

    /** Le cœur du correctif : plus de lecture sans session. */
    public function test_a_visitor_without_a_session_gets_nothing(): void
    {
        $expense = $this->expenseWithReceipt();

        $this->get($this->receiptUrl($expense))->assertRedirect(route('login'));
    }

    public function test_another_tenant_cannot_read_the_receipt(): void
    {
        $intruder = User::factory()->create(['role' => 'super_admin']);
        $foreignShop = Shop::factory()->create(['user_id' => $intruder->id]);
        $intruder->update(['shop_id' => $foreignShop->id]);

        $intruder = $intruder->fresh();
        $expense = $this->expenseWithReceipt();

        $this->actingAs($intruder)
            ->get($this->receiptUrl($expense, $intruder))
            ->assertForbidden();
    }

    /** Une dépense sans justificatif ne doit pas révéler la différence par une erreur serveur. */
    public function test_an_expense_without_a_receipt_is_a_404(): void
    {
        $expense = Expense::factory()->create([
            'shop_id' => $this->shop->id,
            'user_id' => $this->owner->id,
            'receipt' => null,
        ]);

        $this->actingAs($this->owner)
            ->get($this->receiptUrl($expense))
            ->assertNotFound();
    }

    /** Le dépôt lui-même : ce qui arrive ne doit plus atterrir sous /storage. */
    public function test_an_uploaded_receipt_lands_on_the_private_disk(): void
    {
        $this->actingAs($this->owner)->post(
            route('expenses.store', ['code_user' => $this->owner->code_user]),
            [
                'title' => 'Carburant',
                'amount' => 15000,
                'category' => 'transport',
                'expense_date' => now()->toDateString(),
                'receipt' => UploadedFile::fake()->image('ticket.jpg'),
            ],
        );

        $path = Expense::latest('id')->first()->receipt;

        $this->assertNotNull($path);
        Storage::disk(Expense::RECEIPT_DISK)->assertExists($path);
        Storage::disk('public')->assertMissing($path);
    }

    /**
     * Le repli sur `public` couvre la fenêtre entre le déploiement et le passage de la
     * commande : un justificatif déposé avant doit rester consultable, sans quoi le correctif
     * de sécurité efface des pièces comptables de l'écran.
     */
    public function test_a_receipt_left_on_the_public_disk_is_still_served(): void
    {
        Storage::disk('public')->put('receipts/ancien.jpg', 'contenu');

        $expense = Expense::factory()->create([
            'shop_id' => $this->shop->id,
            'user_id' => $this->owner->id,
            'receipt' => 'receipts/ancien.jpg',
        ]);

        $this->actingAs($this->owner)
            ->get($this->receiptUrl($expense))
            ->assertOk();
    }

    public function test_the_command_moves_old_receipts_off_the_public_disk(): void
    {
        Storage::disk('public')->put('receipts/ancien.jpg', 'contenu');

        $expense = Expense::factory()->create([
            'shop_id' => $this->shop->id,
            'user_id' => $this->owner->id,
            'receipt' => 'receipts/ancien.jpg',
        ]);

        $this->artisan('expenses:secure-receipts')->assertSuccessful();

        Storage::disk(Expense::RECEIPT_DISK)->assertExists('receipts/ancien.jpg');
        Storage::disk('public')->assertMissing('receipts/ancien.jpg');

        // Et le fichier reste celui d'origine, pas une copie vide.
        $this->assertSame('contenu', Storage::disk(Expense::RECEIPT_DISK)->get('receipts/ancien.jpg'));
        $this->assertSame('receipts/ancien.jpg', $expense->fresh()->receipt);
    }

    public function test_the_dry_run_moves_nothing(): void
    {
        Storage::disk('public')->put('receipts/ancien.jpg', 'contenu');

        Expense::factory()->create([
            'shop_id' => $this->shop->id,
            'user_id' => $this->owner->id,
            'receipt' => 'receipts/ancien.jpg',
        ]);

        $this->artisan('expenses:secure-receipts', ['--dry-run' => true])->assertSuccessful();

        Storage::disk('public')->assertExists('receipts/ancien.jpg');
        Storage::disk(Expense::RECEIPT_DISK)->assertMissing('receipts/ancien.jpg');
    }
}
