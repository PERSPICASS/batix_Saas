<?php

namespace Tests\Feature\Inventory;

use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

/** Le résultat d'un inventaire — attendu, compté, écart, valeur — en Excel et en PDF. */
class InventoryExportTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;
    private Inventory $inventory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create(['name' => 'Quincaillerie Centrale', 'currency' => 'XOF']);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);

        $this->inventory = Inventory::create([
            'shop_id' => $this->shop->id, 'user_id' => $this->owner->id,
            'inventory_date' => '2026-10-27', 'status' => 'draft',
        ]);

        // 40 m attendus, 37,5 comptés : 2,5 m manquants à 1 000 = −2 500.
        $this->line('Ruban adhésif', 'm', 40, 37.5, 1000);
        // 10 sacs attendus, 12 comptés : 2 en trop à 4 500 = +9 000.
        $this->line('Ciment CPJ 45', 'bag', 10, 12, 4500);
        // Pas compté : ni écart ni valeur, et surtout pas « 0 ».
        $this->line('=Vis 6mm', 'piece', 500, null, 10);
    }

    private function line(string $name, string $unit, float $expected, ?float $counted, float $cost): void
    {
        $product = Product::factory()->create(['shop_id' => $this->shop->id, 'name' => $name, 'unit' => $unit]);

        InventoryItem::create([
            'inventory_id' => $this->inventory->id,
            'product_id' => $product->id,
            'expected_quantity' => $expected,
            'expected_defective_quantity' => 0,
            'counted_quantity' => $counted,
            'unit_cost' => $cost,
        ]);
    }

    public function test_the_excel_file_lists_each_product_with_its_difference_and_value(): void
    {
        $response = $this->actingAs($this->owner)
            ->get("/{$this->owner->code_user}/inventory/{$this->inventory->id}/export")
            ->assertOk();

        $this->assertStringContainsString("inventaire_{$this->inventory->inventory_number}.xlsx", $response->headers->get('content-disposition'));

        // Le filtre anti-formule de l'export reste le lieur de valeurs statique de
        // PhpSpreadsheet après l'écriture : la relecture lui passerait le « -2.5 » lu dans le
        // XML, qu'il préfixerait d'une apostrophe. Le fichier, lui, contient bien un nombre.
        Cell::setValueBinder(new DefaultValueBinder());
        $sheet = IOFactory::load($response->getFile()->getPathname())->getActiveSheet();
        $rows = $sheet->toArray(null, false, false);

        $this->assertSame('Produit', $rows[3][0]);
        // Par nom : =Vis, Ciment, Ruban — le « = » ne doit pas devenir une formule.
        [$screws, $cement, $ribbon, $total] = array_slice($rows, 4);

        $this->assertSame(["'=Vis 6mm", 'Pièce', 500.0], [$screws[0], $screws[2], $screws[3]]);
        $this->assertFalse($sheet->getCell('A5')->isFormula());
        $this->assertSame([null, null, null], [$screws[4], $screws[5], $screws[10]], 'Une ligne non comptée reste vide, pas à 0.');

        $this->assertSame(['Ciment CPJ 45', 'Sac'], [$cement[0], $cement[2]]);
        $this->assertEquals([10, 12, 2, 9000], [$cement[3], $cement[4], $cement[5], $cement[10]]);

        $this->assertSame(['Ruban adhésif', 'm'], [$ribbon[0], $ribbon[2]]);
        $this->assertEquals([40, 37.5, -2.5, -2500], [$ribbon[3], $ribbon[4], $ribbon[5], $ribbon[10]]);

        $this->assertSame('Total', $total[0]);
        $this->assertEquals(6500, $total[10]);
    }

    public function test_the_pdf_prints_the_result(): void
    {
        $this->actingAs($this->owner)
            ->get("/{$this->owner->code_user}/inventory/{$this->inventory->id}/pdf")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_the_pdf_shows_quantities_with_their_unit_and_the_signed_values(): void
    {
        app()->setLocale('fr');
        $html = $this->html();

        $this->assertStringContainsString('INVENTAIRE', $html);
        $this->assertStringContainsString($this->inventory->inventory_number, $html);
        $this->assertStringContainsString('37,5 m', $html);
        $this->assertStringContainsString('-2,5 m', $html);
        $this->assertStringContainsString('+2', $html);
        // Manquants, excédents, net.
        $this->assertStringContainsString('-2 500,00', $html);
        $this->assertStringContainsString('+9 000,00', $html);
        $this->assertStringContainsString('+6 500,00', $html);
        $this->assertStringContainsString('2 / 3', $html);
        $this->assertStringContainsString("pas encore été appliqués", $html, 'Un brouillon le dit.');
    }

    public function test_a_completed_inventory_no_longer_says_it_is_pending(): void
    {
        $this->inventory->update(['status' => 'completed', 'completed_at' => now()]);

        app()->setLocale('fr');
        $this->assertStringNotContainsString('pas encore été appliqués', $this->html());
    }

    public function test_another_account_can_export_neither_file(): void
    {
        $other = Shop::factory()->create();
        $intruder = User::factory()->create(['role' => 'super_admin', 'shop_id' => $other->id]);
        $other->update(['user_id' => $intruder->id]);
        $this->subscribeOwnerOf($other);

        foreach (['pdf', 'export'] as $action) {
            $response = $this->actingAs($intruder)->get("/{$intruder->code_user}/inventory/{$this->inventory->id}/{$action}");
            $this->assertContains($response->status(), [403, 404], $action);
        }
    }

    private function html(): string
    {
        $inventory = $this->inventory->fresh(['items.product', 'shop', 'user']);

        return view('pdf.inventory', [
            'inventory' => $inventory,
            'items' => $inventory->items->sortBy(fn ($item) => mb_strtolower($item->product->name))->values(),
            'logo' => null,
            'shop' => $this->shop,
            'currencySymbol' => 'F',
        ])->render();
    }
}
