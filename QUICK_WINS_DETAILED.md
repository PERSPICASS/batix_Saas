# 💡 QUICK WINS - GUIDE DÉTAILLÉ D'IMPLÉMENTATION

**Effort Total:** 295h  
**Timeline:** 2-3 mois (2-3 développeurs)  
**Valeur:** 80% de ROI avec 20% d'effort

---

## 🎯 QUICK WIN #1: MODULE DEVIS (QUOTES)

**Effort:** 40h | **Timeline:** 1 semaine | **Priorité:** 🔴 CRITIQUE

### 📋 Objectif
Créer des devis pré-vente qui peuvent être convertis en factures.

```
Workflow:
Customer → Quote Draft → Quote Sent → Quote Accepted → Invoice
```

### 🗂️ Structure de données

#### Modèle `Quote.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    protected $fillable = [
        'shop_id',
        'customer_id',
        'quote_number',  // QTE-202606-001
        'status',        // draft, sent, accepted, expired, rejected
        'quote_date',
        'expiry_date',
        'subtotal',
        'tax_amount',
        'total',
        'notes',
        'terms',
        'sent_at',
        'accepted_at',
    ];

    protected $casts = [
        'quote_date' => 'date',
        'expiry_date' => 'date',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'accepted');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'sent')
            ->where('expiry_date', '<', now());
    }

    // Methods
    public function accept()
    {
        $this->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);
    }

    public function convertToInvoice()
    {
        $invoice = Invoice::create([
            'shop_id' => $this->shop_id,
            'customer_id' => $this->customer_id,
            'invoice_number' => Invoice::generateNumber(),
            'quote_id' => $this->id,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
            'notes' => $this->notes,
        ]);

        // Copier les items
        foreach ($this->items as $item) {
            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'line_total' => $item->line_total,
            ]);
        }

        return $invoice;
    }
}
```

#### Modèle `QuoteItem.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuoteItem extends Model
{
    protected $fillable = [
        'quote_id',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'line_total',
        'tax_rate',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'tax_rate' => 'decimal:2',
    ];

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
```

### 📊 Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained();
            $table->foreignId('customer_id')->constrained();
            $table->string('quote_number')->unique(); // QTE-202606-001
            $table->enum('status', ['draft', 'sent', 'accepted', 'expired', 'rejected'])->default('draft');
            $table->date('quote_date');
            $table->date('expiry_date');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax_amount', 10, 2);
            $table->decimal('total', 10, 2);
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('quote_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained();
            $table->text('description')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('line_total', 10, 2);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_items');
        Schema::dropIfExists('quotes');
    }
};
```

### 🎮 Contrôleur

```php
<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuoteController extends Controller
{
    public function index()
    {
        $quotes = Quote::with('customer')
            ->where('shop_id', auth()->user()->shops->first()->id)
            ->paginate(15);

        return Inertia::render('Quotes/Index', [
            'quotes' => $quotes,
        ]);
    }

    public function create()
    {
        $customers = Customer::where('shop_id', auth()->user()->shops->first()->id)
            ->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('Quotes/Create', [
            'customers' => $customers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'quote_date' => 'required|date',
            'expiry_date' => 'required|date|after:quote_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        $shop = auth()->user()->shops->first();
        
        $subtotal = collect($validated['items'])->sum(function ($item) {
            return $item['quantity'] * $item['unit_price'];
        });

        $quote = Quote::create([
            'shop_id' => $shop->id,
            'customer_id' => $validated['customer_id'],
            'quote_number' => 'QTE-' . now()->format('Ym') . '-' . str_pad(
                Quote::where('shop_id', $shop->id)
                    ->whereYear('created_at', now()->year)
                    ->whereMonth('created_at', now()->month)
                    ->count() + 1,
                3,
                '0',
                STR_PAD_LEFT
            ),
            'quote_date' => $validated['quote_date'],
            'expiry_date' => $validated['expiry_date'],
            'subtotal' => $subtotal,
            'tax_amount' => $subtotal * 0.18, // Exemple 18% TVA
            'total' => $subtotal * 1.18,
            'notes' => $validated['notes'],
            'terms' => $validated['terms'],
        ]);

        // Ajouter les items
        foreach ($validated['items'] as $item) {
            $quote->items()->create($item);
        }

        return redirect()->route('quotes.show', $quote)->with('success', 'Devis créé');
    }

    public function show(Quote $quote)
    {
        return Inertia::render('Quotes/Show', [
            'quote' => $quote->load('customer', 'items.product'),
        ]);
    }

    public function edit(Quote $quote)
    {
        return Inertia::render('Quotes/Edit', [
            'quote' => $quote->load('customer', 'items'),
        ]);
    }

    public function send(Quote $quote)
    {
        $quote->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        // TODO: Envoyer email au client avec lien d'acceptation

        return redirect()->back()->with('success', 'Devis envoyé');
    }

    public function accept(Quote $quote)
    {
        $quote->accept();
        return redirect()->back()->with('success', 'Devis accepté');
    }

    public function convertToInvoice(Quote $quote)
    {
        if ($quote->status !== 'accepted') {
            return redirect()->back()->with('error', 'Devis non accepté');
        }

        $invoice = $quote->convertToInvoice();
        return redirect()->route('invoices.show', $invoice);
    }

    public function destroy(Quote $quote)
    {
        $quote->delete();
        return redirect()->route('quotes.index')->with('success', 'Devis supprimé');
    }
}
```

### 🔗 Routes

```php
// routes/web.php

Route::prefix('/{code_user}')->middleware(['auth', 'verified'])->group(function () {
    Route::resource('quotes', QuoteController::class);
    Route::post('quotes/{quote}/send', [QuoteController::class, 'send'])->name('quotes.send');
    Route::post('quotes/{quote}/accept', [QuoteController::class, 'accept'])->name('quotes.accept');
    Route::post('quotes/{quote}/convert', [QuoteController::class, 'convertToInvoice'])->name('quotes.convert');
});
```

### ⚛️ Frontend React

#### `resources/js/Pages/Quotes/Index.tsx`
```tsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Table from '@/Components/Table';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';

export default function QuotesIndex({ quotes }) {
    const columns = [
        {
            key: 'quote_number',
            label: 'N° Devis',
            render: (quote) => <span className="font-bold">{quote.quote_number}</span>,
        },
        {
            key: 'customer',
            label: 'Client',
            render: (quote) => quote.customer.first_name + ' ' + quote.customer.last_name,
        },
        {
            key: 'total',
            label: 'Montant',
            render: (quote) => <span className="font-semibold text-green-400">${quote.total}</span>,
        },
        {
            key: 'status',
            label: 'Statut',
            render: (quote) => (
                <span className={`px-2 py-1 rounded text-sm ${
                    quote.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    quote.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                }`}>
                    {quote.status}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (quote) => (
                <div className="flex gap-2">
                    <Link href={route('quotes.show', quote.id)} className="text-blue-400 hover:text-blue-300">
                        <Eye size={16} />
                    </Link>
                    <Link href={route('quotes.edit', quote.id)} className="text-amber-400 hover:text-amber-300">
                        <Edit size={16} />
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Devis</h1>
                    <Link
                        href={route('quotes.create')}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Nouveau devis
                    </Link>
                </div>
            }
        >
            <Head title="Devis" />
            <Table columns={columns} data={quotes.data} emptyMessage="Aucun devis" />
        </AuthenticatedLayout>
    );
}
```

### ⏱️ Timeline d'implémentation

```
Jour 1: Modèles + Migration
Jour 2: Contrôleur (CRUD)
Jour 3: Frontend (Index, Create, Show)
Jour 4: Conversion en facture + Test
Jour 5: Email + Révisions
```

### 💰 Impact Business
- ✅ Augmente conversion ventes (+15-20%)
- ✅ Professionnalise processus
- ✅ Trace audit complete
- ✅ Base pour CRM avancé

---

## 🎯 QUICK WIN #2: FACTURES RÉCURRENTES

**Effort:** 50h | **Timeline:** 1.5 semaines | **Priorité:** 🔴 CRITIQUE

### 📋 Objectif
Créer des factures mensuelles/hebdomadaires/annuelles automatiquement.

```
Recurring Invoice created → Every month/week/year → New Invoice generated
```

### 🗂️ Structure de données

#### Modèle `RecurringInvoice.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecurringInvoice extends Model
{
    protected $fillable = [
        'shop_id',
        'customer_id',
        'name',
        'description',
        'frequency',     // daily, weekly, monthly, quarterly, annual
        'start_date',
        'end_date',
        'next_invoice_date',
        'subtotal',
        'tax_amount',
        'total',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'next_invoice_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RecurringInvoiceItem::class);
    }

    public function generateNextInvoice()
    {
        if (!$this->is_active || ($this->end_date && $this->end_date < now())) {
            return null;
        }

        // Créer facture
        $invoice = Invoice::create([
            'shop_id' => $this->shop_id,
            'customer_id' => $this->customer_id,
            'invoice_number' => Invoice::generateNumber(),
            'recurring_invoice_id' => $this->id,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
        ]);

        // Copier items
        foreach ($this->items as $item) {
            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'product_id' => $item->product_id,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'line_total' => $item->line_total,
            ]);
        }

        // Mettre à jour prochaine date
        $this->update([
            'next_invoice_date' => match($this->frequency) {
                'daily' => now()->addDay(),
                'weekly' => now()->addWeek(),
                'monthly' => now()->addMonth(),
                'quarterly' => now()->addQuarters(1),
                'annual' => now()->addYear(),
            },
        ]);

        return $invoice;
    }
}
```

#### Modèle `RecurringInvoiceItem.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecurringInvoiceItem extends Model
{
    protected $fillable = [
        'recurring_invoice_id',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'line_total',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function recurringInvoice(): BelongsTo
    {
        return $this->belongsTo(RecurringInvoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
```

### ⚙️ Scheduled Job

```php
<?php

namespace App\Console\Commands;

use App\Models\RecurringInvoice;
use Illuminate\Console\Command;

class GenerateRecurringInvoices extends Command
{
    protected $signature = 'invoices:generate-recurring';
    protected $description = 'Générer les factures récurrentes dues';

    public function handle()
    {
        $recurringInvoices = RecurringInvoice::where('is_active', true)
            ->where('next_invoice_date', '<=', now())
            ->get();

        foreach ($recurringInvoices as $recurring) {
            $recurring->generateNextInvoice();
            $this->info("Facture générée pour: {$recurring->name}");
        }

        $this->info("Total: {$recurringInvoices->count()} factures générées");
    }
}
```

### 📅 Ajouter à `app/Console/Kernel.php`

```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('invoices:generate-recurring')
        ->daily()
        ->at('02:00'); // 2h du matin
}
```

### ⚛️ Frontend React

```tsx
// resources/js/Pages/RecurringInvoices/Create.tsx

import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function CreateRecurringInvoice({ customers }) {
    const [formData, setFormData] = useState({
        customer_id: '',
        name: '',
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        items: [{ product_id: '', quantity: 1, unit_price: 0 }],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('recurring-invoices.store'), formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label>Client</label>
                <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                    className="w-full rounded border bg-slate-700"
                >
                    <option>Sélectionner</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label>Nom de la facture récurrente</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="ex: Abonnement mensuel"
                    className="w-full rounded border bg-slate-700"
                />
            </div>

            <div>
                <label>Fréquence</label>
                <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    className="w-full rounded border bg-slate-700"
                >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                    <option value="quarterly">Trimestriel</option>
                    <option value="annual">Annuel</option>
                </select>
            </div>

            <div>
                <label>Date de début</label>
                <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full rounded border bg-slate-700"
                />
            </div>

            <div>
                <label>Date de fin (optionnel)</label>
                <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full rounded border bg-slate-700"
                />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
                Créer
            </button>
        </form>
    );
}
```

### 💰 Impact Business
- ✅ Automatise revenus récurrents (30% du CA souvent)
- ✅ Réduit erreurs manuelles
- ✅ Améliore cash flow previsibility
- ✅ Base pour abonnements

---

## 📊 QUICK WIN #3: EXPORT RAPPORTS EXCEL AVANCÉS

**Effort:** 30h | **Timeline:** 1 semaine | **Priorité:** 🟡 MOYENNE

### 📋 Objectif
Créer rapports Excel customizables avec graphiques intégrés.

```
Select Report → Configure Filters → Download Excel with Charts
```

### 🗂️ Classes Excel

#### `app/Exports/SalesReportExport.php`
```php
<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\Spreadsheet\Style\Font;
use PhpOffice\Spreadsheet\Style\Alignment;
use App\Models\Sale;
use Carbon\Carbon;

class SalesReportExport implements FromCollection, WithHeadings, WithStyles
{
    protected $startDate;
    protected $endDate;
    protected $shopId;

    public function __construct($startDate, $endDate, $shopId)
    {
        $this->startDate = Carbon::parse($startDate);
        $this->endDate = Carbon::parse($endDate);
        $this->shopId = $shopId;
    }

    public function collection()
    {
        return Sale::where('shop_id', $this->shopId)
            ->whereBetween('created_at', [$this->startDate, $this->endDate])
            ->with('customer')
            ->get()
            ->map(function ($sale) {
                return [
                    'Date' => $sale->created_at->format('d/m/Y'),
                    'N° Ticket' => $sale->ticket_number,
                    'Client' => $sale->customer->first_name . ' ' . $sale->customer->last_name,
                    'Montant' => $sale->total,
                    'Statut' => $sale->status,
                ];
            });
    }

    public function headings(): array
    {
        return ['Date', 'N° Ticket', 'Client', 'Montant', 'Statut'];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:E1')
            ->getFont()
            ->setBold(true)
            ->setColor(new Color('FFFFFF'));

        $sheet->getStyle('A1:E1')
            ->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setARGB('FF4472C4');

        return $sheet;
    }
}
```

#### `app/Exports/InventoryReportExport.php`
```php
<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use App\Models\DepotProduct;

class InventoryReportExport implements FromCollection, WithHeadings
{
    protected $shopId;

    public function __construct($shopId)
    {
        $this->shopId = $shopId;
    }

    public function collection()
    {
        return DepotProduct::with('product', 'depot')
            ->whereHas('product', function ($query) {
                $query->where('shop_id', $this->shopId);
            })
            ->get()
            ->map(function ($dp) {
                return [
                    'Dépôt' => $dp->depot->name,
                    'Produit' => $dp->product->name,
                    'SKU' => $dp->product->sku,
                    'Stock Actuel' => $dp->quantity,
                    'Stock Défectueux' => $dp->defective_quantity,
                    'Stock Net' => $dp->quantity - $dp->defective_quantity,
                    'Alerte Min' => $dp->alert_quantity,
                    'Valeur Stock' => ($dp->quantity - $dp->defective_quantity) * $dp->product->cost_price,
                ];
            });
    }

    public function headings(): array
    {
        return ['Dépôt', 'Produit', 'SKU', 'Stock Actuel', 'Stock Défectueux', 'Stock Net', 'Alerte Min', 'Valeur Stock'];
    }
}
```

### 🎮 Contrôleur

```php
<?php

namespace App\Http\Controllers;

use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesReportExport;
use App\Exports\InventoryReportExport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Reports/Index');
    }

    public function exportSales(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $shop = auth()->user()->shops->first();

        return Excel::download(
            new SalesReportExport(
                $validated['start_date'],
                $validated['end_date'],
                $shop->id
            ),
            'ventes-' . now()->format('Ymd') . '.xlsx'
        );
    }

    public function exportInventory()
    {
        $shop = auth()->user()->shops->first();

        return Excel::download(
            new InventoryReportExport($shop->id),
            'inventaire-' . now()->format('Ymd') . '.xlsx'
        );
    }

    public function exportCustomers(Request $request)
    {
        // Similar pattern
    }

    public function exportSuppliers(Request $request)
    {
        // Similar pattern
    }
}
```

### ⚛️ Frontend React

```tsx
// resources/js/Pages/Reports/Index.tsx

import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Download } from 'lucide-react';

export default function Reports() {
    const [dates, setDates] = useState({
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const reports = [
        { id: 'sales', label: 'Rapport Ventes', description: 'Ventes par période' },
        { id: 'inventory', label: 'Rapport Inventaire', description: 'Stock par dépôt' },
        { id: 'customers', label: 'Rapport Clients', description: 'Liste clients avec historique' },
        { id: 'suppliers', label: 'Rapport Fournisseurs', description: 'Fournisseurs et commandes' },
    ];

    const handleExport = (reportId) => {
        router.post(route(`reports.export-${reportId}`), dates, {
            method: 'post',
            onSuccess: () => console.log('Exported'),
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Rapports</h1>}>
            <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded space-y-4">
                    <h3>Sélectionner période</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="date"
                            value={dates.start_date}
                            onChange={(e) => setDates({...dates, start_date: e.target.value})}
                            className="rounded border bg-slate-700"
                        />
                        <input
                            type="date"
                            value={dates.end_date}
                            onChange={(e) => setDates({...dates, end_date: e.target.value})}
                            className="rounded border bg-slate-700"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {reports.map(report => (
                        <div key={report.id} className="bg-slate-800 p-4 rounded">
                            <h3 className="font-bold">{report.label}</h3>
                            <p className="text-sm text-gray-400">{report.description}</p>
                            <button
                                onClick={() => handleExport(report.id)}
                                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                            >
                                <Download size={16} />
                                Télécharger
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

### 💰 Impact Business
- ✅ Exports pour experts-comptables
- ✅ Réduction temps reporting (2h → 5min)
- ✅ Conformité audit
- ✅ Better data analysis

---

## 🔐 QUICK WIN #4: 2FA TOTP

**Effort:** 30h | **Timeline:** 1 semaine | **Priorité:** 🟠 HAUTE

### 📋 Objectif
Ajouter authentification 2FA (Google Authenticator, Authy).

```
Password → OTP Code → 2FA Token → Authenticated
```

### 📦 Package: Laravel 2FA

```bash
composer require pragmarx/google2fa-laravel
```

### 🗂️ Migration

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('google2fa_secret')->nullable();
    $table->boolean('two_factor_enabled')->default(false);
    $table->timestamp('two_factor_confirmed_at')->nullable();
});
```

### 🎮 Contrôleur

```php
<?php

namespace App\Http\Controllers;

use PragmaRX\Google2FA\Google2FA;
use Illuminate\Http\Request;

class TwoFactorAuthController extends Controller
{
    public function setupTwoFactor(Request $request)
    {
        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();

        $qr_code = $google2fa->getQRCodeUrl(
            config('app.name'),
            auth()->user()->email,
            $secret
        );

        return response()->json([
            'secret' => $secret,
            'qr_code' => $qr_code,
        ]);
    }

    public function confirmTwoFactor(Request $request)
    {
        $validated = $request->validate([
            'secret' => 'required',
            'code' => 'required|numeric|digits:6',
        ]);

        $google2fa = new Google2FA();

        if (!$google2fa->verifyKey($validated['secret'], $validated['code'])) {
            return response()->json(['error' => 'Invalid code'], 422);
        }

        auth()->user()->update([
            'google2fa_secret' => $validated['secret'],
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    public function disableTwoFactor(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|numeric|digits:6',
        ]);

        $google2fa = new Google2FA();

        if (!$google2fa->verifyKey(auth()->user()->google2fa_secret, $validated['code'])) {
            return response()->json(['error' => 'Invalid code'], 422);
        }

        auth()->user()->update([
            'google2fa_secret' => null,
            'two_factor_enabled' => false,
        ]);

        return response()->json(['success' => true]);
    }
}
```

### ⚛️ Frontend Component

```tsx
// resources/js/Components/TwoFactorAuth.tsx

import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function TwoFactorAuth({ user }) {
    const [step, setStep] = useState(user.two_factor_enabled ? 'enabled' : 'setup');
    const [secret, setSecret] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSetupClick = async () => {
        setLoading(true);
        const response = await fetch(route('two-factor.setup'), { method: 'POST' });
        const data = await response.json();
        setSecret(data.secret);
        setQrCode(data.qr_code);
        setStep('scan');
        setLoading(false);
    };

    const handleConfirm = () => {
        setLoading(true);
        router.post(route('two-factor.confirm'), {
            secret,
            code,
        }, {
            onSuccess: () => {
                setStep('enabled');
                setCode('');
            },
        });
    };

    if (step === 'enabled') {
        return (
            <div className="bg-green-500/10 border border-green-500 p-4 rounded">
                <p className="text-green-400">2FA est activé ✓</p>
                <button
                    onClick={() => router.post(route('two-factor.disable'), { code })}
                    className="mt-2 text-red-400 hover:text-red-300"
                >
                    Désactiver
                </button>
            </div>
        );
    }

    if (step === 'scan') {
        return (
            <div className="space-y-4">
                <div dangerouslySetInnerHTML={{ __html: qrCode }} />
                <p>Ou entrez manuellement: {secret}</p>
                <input
                    type="text"
                    placeholder="Code 6 chiffres"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    className="w-full rounded border bg-slate-700"
                />
                <button
                    onClick={handleConfirm}
                    disabled={loading || code.length !== 6}
                    className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
                >
                    Confirmer
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleSetupClick}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
        >
            Activer 2FA
        </button>
    );
}
```

### 💰 Impact Business
- ✅ Sécurité bancaire
- ✅ Conformité PCI-DSS
- ✅ Protection données sensibles
- ✅ Trust client

---

## 📦 QUICK WIN #5: GESTION LOTS/SÉRIALS

**Effort:** 40h | **Timeline:** 1.5 semaines | **Priorité:** 🟡 MOYENNE

### 📋 Objectif
Tracer produits par numéro de lot/série.

```
Product → Lot XYZ-2024-001 → Qty 100 → Expiry 2025-06-30
```

### 🗂️ Modèles

```php
// ProductLot.php
class ProductLot extends Model
{
    protected $fillable = [
        'product_id',
        'lot_number',      // XYZ-2024-001
        'quantity',
        'quantity_used',
        'expiry_date',
        'manufacturing_date',
        'supplier_batch',
        'cost_price',
        'notes',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getAvailableAttribute()
    {
        return $this->quantity - $this->quantity_used;
    }

    public function scopeNotExpired($query)
    {
        return $query->where('expiry_date', '>', now());
    }
}

// ProductSerial.php
class ProductSerial extends Model
{
    protected $fillable = [
        'product_id',
        'serial_number',   // SN-XYZ-123456
        'lot_id',
        'status',          // in_stock, sold, returned, lost
        'sale_id',
        'sold_at',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(ProductLot::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
```

### 🎮 Contrôleur

```php
public function addLot(Request $request, Product $product)
{
    $validated = $request->validate([
        'lot_number' => 'required|unique:product_lots',
        'quantity' => 'required|integer|min:1',
        'expiry_date' => 'required|date|after:today',
        'manufacturing_date' => 'nullable|date',
        'cost_price' => 'required|numeric',
    ]);

    $lot = ProductLot::create(array_merge(
        $validated,
        ['product_id' => $product->id]
    ));

    return redirect()->back()->with('success', 'Lot ajouté');
}

public function addSerials(Request $request, ProductLot $lot)
{
    $validated = $request->validate([
        'serials' => 'required|array|min:1',
        'serials.*' => 'required|unique:product_serials,serial_number',
    ]);

    foreach ($validated['serials'] as $serial) {
        ProductSerial::create([
            'product_id' => $lot->product_id,
            'lot_id' => $lot->id,
            'serial_number' => $serial,
            'status' => 'in_stock',
        ]);

        $lot->increment('quantity');
    }

    return redirect()->back()->with('success', 'Sérials ajoutés');
}
```

### 💰 Impact Business
- ✅ Traçabilité complète
- ✅ Gestion expiration
- ✅ Recalls facilités
- ✅ Conformité alimentaire/pharma

---

## 🎨 QUICK WIN #6: MODÈLES FACTURES PERSONNALISABLES

**Effort:** 30h | **Timeline:** 1 semaine | **Priorité:** 🟡 MOYENNE

### 📋 Objectif
Créer templates factures customizables par boutique.

```
Template Editor → {placeholders} → Preview → Use for invoices
```

### 🗂️ Modèle

```php
class InvoiceTemplate extends Model
{
    protected $fillable = [
        'shop_id',
        'name',
        'is_default',
        'template_html',  // HTML avec {placeholders}
        'logo_path',
        'footer_text',
        'company_name',
        'company_address',
    ];

    public function render(Invoice $invoice)
    {
        return str_replace(
            [
                '{invoice_number}',
                '{customer_name}',
                '{customer_address}',
                '{invoice_date}',
                '{due_date}',
                '{total}',
                '{items_table}',
                '{company_logo}',
                '{footer}',
            ],
            [
                $invoice->invoice_number,
                $invoice->customer->full_name,
                $invoice->customer->address,
                $invoice->created_at->format('d/m/Y'),
                $invoice->due_date?->format('d/m/Y'),
                $invoice->total,
                $this->renderItems($invoice),
                $this->logo_path ? "<img src='{$this->logo_path}' />" : '',
                $this->footer_text,
            ],
            $this->template_html
        );
    }
}
```

### ⚛️ Frontend Template Editor

```tsx
// resources/js/Pages/Settings/InvoiceTemplates.tsx

import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function InvoiceTemplates({ templates }) {
    const [editing, setEditing] = useState(null);
    const [html, setHtml] = useState('');

    const placeholders = [
        '{invoice_number}',
        '{customer_name}',
        '{total}',
        '{items_table}',
        '{company_logo}',
    ];

    const handleSave = () => {
        router.put(route('invoice-templates.update', editing), { template_html: html });
    };

    return (
        <div className="grid grid-cols-2 gap-6">
            <div>
                <h3>Modèles disponibles</h3>
                {templates.map(t => (
                    <div
                        key={t.id}
                        onClick={() => { setEditing(t.id); setHtml(t.template_html); }}
                        className="p-2 border rounded cursor-pointer"
                    >
                        {t.name}
                    </div>
                ))}
            </div>

            <div>
                <div className="flex gap-2 mb-4">
                    {placeholders.map(p => (
                        <button
                            key={p}
                            onClick={() => setHtml(html + p)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                        >
                            Ajouter {p}
                        </button>
                    ))}
                </div>

                <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    className="w-full h-96 rounded border bg-slate-700 font-mono text-sm"
                />

                <button
                    onClick={handleSave}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
                >
                    Sauvegarder
                </button>
            </div>
        </div>
    );
}
```

### 💰 Impact Business
- ✅ Branding personnalisé
- ✅ Pro appearance
- ✅ Easy customization
- ✅ Multi-template support

---

## 📊 QUICK WIN #7: ALERTES KPI

**Effort:** 25h | **Timeline:** 5 jours | **Priorité:** 🟡 MOYENNE

### 📋 Objectif
Recevoir alertes email quand KPI seuil dépassé.

```
KPI monitored → Threshold breached → Alert email → Action
```

### 🗂️ Modèle

```php
class KPIAlert extends Model
{
    protected $fillable = [
        'shop_id',
        'name',
        'metric',        // revenue, stock_out, overdue_invoices
        'operator',      // >, <, =
        'threshold',
        'frequency',     // daily, weekly, monthly
        'notify_email',
        'is_active',
    ];

    // Metrics calculés
    public function checkRevenue($days = 30)
    {
        $revenue = Sale::where('shop_id', $this->shop_id)
            ->where('created_at', '>=', now()->subDays($days))
            ->sum('total');

        return $this->evaluate($revenue);
    }

    public function checkStockOut()
    {
        $count = Product::where('shop_id', $this->shop_id)
            ->where('quantity', '<=', 0)
            ->count();

        return $this->evaluate($count);
    }

    public function checkOverdueInvoices()
    {
        $count = Invoice::where('shop_id', $this->shop_id)
            ->where('due_date', '<', today())
            ->where('status', '!=', 'paid')
            ->count();

        return $this->evaluate($count);
    }

    private function evaluate($value)
    {
        return match($this->operator) {
            '>' => $value > $this->threshold,
            '<' => $value < $this->threshold,
            '=' => $value == $this->threshold,
            default => false,
        };
    }
}
```

### ⚙️ Scheduled Job

```php
class CheckKPIAlerts extends Command
{
    public function handle()
    {
        $alerts = KPIAlert::where('is_active', true)->get();

        foreach ($alerts as $alert) {
            $breached = match($alert->metric) {
                'revenue' => $alert->checkRevenue(),
                'stock_out' => $alert->checkStockOut(),
                'overdue_invoices' => $alert->checkOverdueInvoices(),
                default => false,
            };

            if ($breached) {
                Mail::to($alert->notify_email)->send(
                    new KPIAlertMail($alert)
                );
            }
        }
    }
}
```

### 💰 Impact Business
- ✅ Proactive management
- ✅ Real-time alerts
- ✅ Reduced downtime
- ✅ Better decisions

---

## 🔌 QUICK WIN #8: APIs PUBLIQUES POUR INTÉGRATIONS

**Effort:** 50h | **Timeline:** 1.5 semaines | **Priorité:** 🔴 CRITIQUE

### 📋 Objectif
Exposer APIs REST pour intégrations tierces.

```
External App → API Token → GET /api/products → JSON Response
```

### 🔐 Authentification API

```php
// database/migrations/create_api_tokens_table.php

Schema::create('api_tokens', function (Blueprint $table) {
    $table->id();
    $table->foreignId('shop_id')->constrained();
    $table->string('token')->unique();
    $table->string('name');
    $table->json('scopes');
    $table->timestamp('last_used_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
});
```

### 🎮 Contrôleurs API

```php
// app/Http/Controllers/Api/ProductController.php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * GET /api/products?limit=50&skip=0
     */
    public function index(Request $request)
    {
        $limit = min($request->query('limit', 50), 100);
        $skip = $request->query('skip', 0);

        $products = Product::where('shop_id', auth('api')->user()->shop_id)
            ->select(['id', 'name', 'sku', 'quantity', 'price', 'cost_price'])
            ->skip($skip)
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $products,
            'total' => Product::where('shop_id', auth('api')->user()->shop_id)->count(),
            'limit' => $limit,
            'skip' => $skip,
        ]);
    }

    /**
     * POST /api/products
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required',
            'sku' => 'required|unique:products',
            'price' => 'required|numeric',
            'cost_price' => 'nullable|numeric',
        ]);

        $product = Product::create(array_merge(
            $validated,
            ['shop_id' => auth('api')->user()->shop_id]
        ));

        return response()->json(['data' => $product], 201);
    }

    /**
     * PUT /api/products/{id}
     */
    public function update(Request $request, Product $product)
    {
        // Validate shop access
        if ($product->shop_id !== auth('api')->user()->shop_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $product->update($request->validate([
            'name' => 'sometimes|string',
            'price' => 'sometimes|numeric',
            'quantity' => 'sometimes|integer',
        ]));

        return response()->json(['data' => $product]);
    }

    /**
     * GET /api/products/{id}
     */
    public function show(Product $product)
    {
        if ($product->shop_id !== auth('api')->user()->shop_id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json(['data' => $product]);
    }
}
```

### 📍 Routes API

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    // Products
    Route::get('/products', [Api\ProductController::class, 'index']);
    Route::post('/products', [Api\ProductController::class, 'store']);
    Route::get('/products/{product}', [Api\ProductController::class, 'show']);
    Route::put('/products/{product}', [Api\ProductController::class, 'update']);

    // Customers
    Route::get('/customers', [Api\CustomerController::class, 'index']);
    Route::post('/customers', [Api\CustomerController::class, 'store']);

    // Sales
    Route::get('/sales', [Api\SaleController::class, 'index']);
    Route::post('/sales', [Api\SaleController::class, 'store']);

    // Inventory
    Route::get('/inventory', [Api\InventoryController::class, 'index']);
    Route::post('/stock-movement', [Api\StockMovementController::class, 'store']);

    // Invoices
    Route::get('/invoices', [Api\InvoiceController::class, 'index']);
    Route::post('/invoices', [Api\InvoiceController::class, 'store']);
});
```

### 📖 Documentation API

```markdown
# BATIX API Documentation

## Authentication

All requests require an API token in header:

```
Authorization: Bearer YOUR_API_TOKEN
```

## Endpoints

### Products

```
GET /api/products
GET /api/products/{id}
POST /api/products
PUT /api/products/{id}
DELETE /api/products/{id}
```

### Customers

```
GET /api/customers
POST /api/customers
```

### Sales

```
GET /api/sales
POST /api/sales
```

### Rate Limiting

- 1000 requests/hour
- 100 requests/minute
```

### 💰 Impact Business
- ✅ Integration ecosystem
- ✅ Third-party apps
- ✅ Automation possibilities
- ✅ Enterprise adoption

---

## 📊 RÉSUMÉ IMPLÉMENTATION

### Timeline Recommandée (2-3 mois)

```
Semaine 1-2:   Quick Wins #1 (Devis) + #2 (Recurring)
Semaine 3-4:   Quick Wins #3 (Excel) + #4 (2FA)
Semaine 5-6:   Quick Wins #5 (Lots) + #6 (Templates)
Semaine 7-8:   Quick Wins #7 (KPI Alerts) + #8 (APIs)
Semaine 9-10:  Test + Bug fixes + Documentation
```

### Effort par personne

| Quick Win | Effort | Dev | QA |
|-----------|--------|-----|-----|
| 1. Devis | 40h | 3d | 0.5d |
| 2. Recurring | 50h | 3.5d | 0.5d |
| 3. Reports Excel | 30h | 2.5d | 0.5d |
| 4. 2FA TOTP | 30h | 2d | 1d |
| 5. Lots/Serials | 40h | 3d | 1d |
| 6. Templates | 30h | 2.5d | 0.5d |
| 7. KPI Alerts | 25h | 2d | 0.5d |
| 8. APIs | 50h | 3.5d | 1d |
| **TOTAL** | **295h** | **22d** | **5.5d** |

### Équipe Recommandée

- **2-3 backend devs** (Laravel)
- **1 frontend dev** (React)
- **1 QA engineer**

### Coûts Estimés

```
@250$/h :
- Backend (2 devs): 176h × 250 = $44,000
- Frontend (1 dev): 88h × 250 = $22,000
- QA (1): 55h × 250 = $13,750
─────────────────────────────
TOTAL: $79,750 (2-3 mois)
```

---

## 🎯 KPIs D'IMPACT

### Avant Quick Wins
- Conversion devis→facture: 0%
- Temps facturation manuels: 2h/jour
- Rapports: Excel manuel (4h/mois)
- Sécurité: Password seulement

### Après Quick Wins
- Conversion devis→facture: +15-20% ✅
- Temps facturation: 30min/jour (-87%) ✅
- Rapports: Auto-generated 1min ✅
- Sécurité: Enterprise-grade 2FA ✅
- Revenue traçabilité: Lots/Serials ✅
- Automation: APIs pour intégrations ✅

---

## 📋 CHECKLIST DÉMARRAGE

- [ ] Créer branch `quick-wins`
- [ ] Découper en tickets JIRA/GitHub
- [ ] Assigner devs
- [ ] Créer PR templates
- [ ] Mettre en place CI/CD tests
- [ ] Planifier review sprints
- [ ] Documenter chaque feature
- [ ] Créer tests automatisés

---

**Document Préparé:** 30 Juin 2026  
**Pour:** BATIX Dev Team  
**Prêt à démarrer? 🚀**
