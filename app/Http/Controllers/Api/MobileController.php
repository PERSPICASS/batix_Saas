<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Preorder;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;

class MobileController extends Controller
{
    /**
     * Vérifie que $shopId appartient bien au compte du token authentifié.
     * Sans ce contrôle, n'importe quel token valide pourrait lire ou écrire
     * les données d'une boutique appartenant à un autre compte.
     */
    private function authorizeShop($user, $shopId): bool
    {
        return $shopId && $user->accessibleShopsQuery()->where('id', $shopId)->exists();
    }

    public function syncSales(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $lastSync = $request->input('last_sync');
        $shopId = $request->input('shop_id');

        if (!$this->authorizeShop($user, $shopId)) {
            return response()->json(['error' => 'Unauthorized shop'], 403);
        }

        $query = Sale::with(['customer', 'items'])
            ->where('shop_id', $shopId)
            ->where('user_id', $user->id);

        if ($lastSync) {
            $query->where('updated_at', '>', $lastSync);
        }

        $sales = $query->limit(100)->get();

        return response()->json([
            'status' => 'success',
            'data' => $sales->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'ticket_number' => $sale->ticket_number,
                    'total' => $sale->total,
                    'status' => $sale->status,
                    'payment_method' => $sale->payment_method,
                    'customer_name' => $sale->customer?->name,
                    'date' => $sale->sale_date,
                ];
            }),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function syncProducts(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $lastSync = $request->input('last_sync');
        $shopId = $request->input('shop_id');

        if (!$this->authorizeShop($user, $shopId)) {
            return response()->json(['error' => 'Unauthorized shop'], 403);
        }

        $query = Product::where('shop_id', $shopId)
            ->where('is_active', true);

        if ($lastSync) {
            $query->where('updated_at', '>', $lastSync);
        }

        $products = $query->limit(500)->get();

        return response()->json([
            'status' => 'success',
            'data' => $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'stock' => $product->stock_quantity,
                    'price' => $product->selling_price,
                    'track_stock' => $product->track_stock,
                ];
            }),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function syncCustomers(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $lastSync = $request->input('last_sync');
        $shopId = $request->input('shop_id');

        if (!$this->authorizeShop($user, $shopId)) {
            return response()->json(['error' => 'Unauthorized shop'], 403);
        }

        $query = Customer::where('shop_id', $shopId);

        if ($lastSync) {
            $query->where('updated_at', '>', $lastSync);
        }

        $customers = $query->limit(500)->get();

        return response()->json([
            'status' => 'success',
            'data' => $customers->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                ];
            }),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function createSale(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'required|in:cash,card,transfer,check,mobile,credit',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        if (!$this->authorizeShop($user, $validated['shop_id'])) {
            return response()->json(['error' => 'Unauthorized shop'], 403);
        }

        try {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['unit_price'] * $item['quantity'];
            }

            $sale = Sale::create([
                'shop_id' => $validated['shop_id'],
                'customer_id' => $validated['customer_id'],
                'user_id' => $user->id,
                'payment_method' => $validated['payment_method'],
                'amount_paid' => $subtotal,
                'status' => 'completed',
                'subtotal' => $subtotal,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'total' => $subtotal,
                'change_amount' => 0,
                'remaining_amount' => 0,
            ]);

            foreach ($validated['items'] as $item) {
                $sale->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => 0,
                ]);
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $sale->id,
                    'ticket_number' => $sale->ticket_number,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function getShopInfo(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $shopId = $request->input('shop_id');
        $shop = $user->accessibleShopsQuery()->find($shopId);

        if (!$shop) {
            return response()->json(['error' => 'Shop not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'currency' => $shop->currency,
                'tax_rate' => $shop->default_tax_rate,
            ],
        ]);
    }
}
