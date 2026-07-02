<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvoiceController extends Controller
{
    use ScopesToAccessibleShops;

    public function index(Request $request): AnonymousResourceCollection
    {
        $invoices = Invoice::whereIn('shop_id', $this->resolveShopIds($request))
            ->with('customer')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('since'), fn ($q) => $q->where('updated_at', '>', $request->query('since')))
            ->orderByDesc('invoice_date')
            ->paginate($this->resolvePerPage($request));

        return InvoiceResource::collection($invoices);
    }

    public function show(Request $request, Invoice $invoice): InvoiceResource
    {
        abort_unless(in_array($invoice->shop_id, $this->resolveShopIds($request), true), 404);

        return new InvoiceResource($invoice->load(['customer', 'items']));
    }
}
