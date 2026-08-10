<?php

namespace Tests\Feature\Import;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Ces tests passent par la vraie requête HTTP (validation + lecture du fichier),
 * contrairement à DepotStockImportTest qui appelle l'importeur directement.
 *
 * Le bug qu'ils verrouillent : un CSV enregistré par Excel en locale française
 * utilise « ; » comme séparateur, ce qui le fait sniffer en text/plain. La règle
 * `mimes:xlsx,xls,csv` comparait cette extension devinée à la liste et renvoyait
 * un 422 « must be a file of type: xlsx, xls, csv » — aucun produit n'entrait
 * jamais dans le dépôt.
 */
class DepotStockCsvUploadTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $shop;
    private Depot $depot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'super_admin']);
        $this->shop  = Shop::factory()->create(['user_id' => $this->owner->id]);
        $this->depot = Depot::factory()->create([
            'user_id'   => $this->owner->id,
            'code_user' => $this->owner->code_user,
        ]);
    }

    private function upload(string $contents, string $name = 'stock.csv')
    {
        $path = tempnam(sys_get_temp_dir(), 'imp') . '-' . $name;
        file_put_contents($path, $contents);

        return $this->actingAs($this->owner)
            ->withSession(['active_shop_id' => $this->shop->id])
            ->postJson("/{$this->owner->code_user}/depots/{$this->depot->id}/stock/import", [
                'file' => new UploadedFile($path, $name, null, null, true),
            ]);
    }

    public function test_comma_separated_csv_imports(): void
    {
        $this->upload("nom,marque,quantite\nPerceuse 500W,Bosch,5\n")
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertSame(5, DepotProduct::sole()->quantity);
    }

    public function test_semicolon_separated_csv_imports(): void
    {
        $this->upload("nom;marque;quantite\nPerceuse 500W;Bosch;5\n")
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertSame(5, DepotProduct::sole()->quantity);
    }

    /** Ce qu'Excel FR produit réellement : BOM UTF-8, « ; », CRLF et en-têtes accentués. */
    public function test_excel_french_export_imports(): void
    {
        $csv = "\u{FEFF}Nom;Marque;Quantité;Stock minimum;Prix d'achat\r\n"
             . "Café moulu 250g;Éthiopia;12;3;1500\r\n";

        $this->upload($csv, 'stock_depot.csv')
            ->assertOk()
            ->assertJson(['success' => true]);

        $line = DepotProduct::sole();
        $this->assertSame(12, $line->quantity);
        $this->assertSame(3, $line->min_stock_alert);
        $this->assertSame('Café moulu 250g', Product::find($line->product_id)->name);
    }

    /**
     * La page envoie désormais l'import via le routeur Inertia (et non un fetch()
     * manuel portant le token CSRF figé du <meta>). Ce chemin doit donc répondre
     * par une redirection flashée, pas par du JSON.
     */
    public function test_the_inertia_path_redirects_back_with_a_flash_message(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'imp') . '-stock.csv';
        file_put_contents($path, "nom;marque;quantite\nPerceuse 500W;Bosch;5\n");

        $response = $this->actingAs($this->owner)
            ->withSession(['active_shop_id' => $this->shop->id])
            ->from("/{$this->owner->code_user}/depots/{$this->depot->id}")
            ->post(
                "/{$this->owner->code_user}/depots/{$this->depot->id}/stock/import",
                ['file' => new UploadedFile($path, 'stock.csv', null, null, true)],
                ['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest', 'Accept' => 'text/html, application/xhtml+xml'],
            );

        $response->assertRedirect("/{$this->owner->code_user}/depots/{$this->depot->id}");
        $response->assertSessionHas('success');

        $this->assertSame(5, DepotProduct::sole()->quantity);
    }

    /** Les lignes en erreur doivent atteindre la page : `import_errors` doit être une prop partagée. */
    public function test_failed_rows_are_reported_to_the_page(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'imp') . '-stock.csv';
        // 2e ligne : une quantité sans le moindre identifiant → ligne refusée.
        file_put_contents($path, "nom;quantite\nPerceuse 500W;5\n;7\n");

        $this->actingAs($this->owner)
            ->withSession(['active_shop_id' => $this->shop->id])
            ->from("/{$this->owner->code_user}/depots/{$this->depot->id}")
            ->post(
                "/{$this->owner->code_user}/depots/{$this->depot->id}/stock/import",
                ['file' => new UploadedFile($path, 'stock.csv', null, null, true)],
                ['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest', 'Accept' => 'text/html, application/xhtml+xml'],
            )
            ->assertSessionHas('warning')
            ->assertSessionHas('import_errors');

        $this->actingAs($this->owner)
            ->get("/{$this->owner->code_user}/depots/{$this->depot->id}")
            ->assertInertia(fn ($page) => $page->has('import_errors', 1));
    }

    public function test_a_file_that_is_not_a_spreadsheet_is_still_rejected(): void
    {
        // PNG déguisé en .csv : l'extension passe, le contenu doit être refusé.
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

        $this->upload($png, 'stock.csv')->assertStatus(422);

        $this->assertSame(0, DepotProduct::count());
    }
}
