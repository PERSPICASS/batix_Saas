<?php

namespace App\Http\Controllers;

use App\Models\ReturnedInventory;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReturnedInventoryController extends Controller
{
    public function index(string $code_user, Request $request)
    {
        $user = Auth::user();
        if (!$user->accessibleShopsQuery()->exists()) {
            abort(403);
        }

        $query = ReturnedInventory::with(['saleReturn', 'product', 'shop', 'reviewedBy'])
            ->whereIn('shop_id', $user->accessibleShopsQuery()->pluck('id'));

        // Filtrer par statut
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtrer par condition
        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        // Filtrer par produit (recherche)
        if ($request->filled('product')) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->product . '%');
            });
        }

        // Filtrer par date (depuis)
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        // Filtrer par date (jusqu'au)
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $items = $query->orderBy('status', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('ReturnedInventory/Index', [
            'items' => $items,
            'filters' => [
                'status' => $request->status,
                'condition' => $request->condition,
                'product' => $request->product,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
            ],
        ]);
    }

    public function approve(string $code_user, ReturnedInventory $item)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'manager'])) {
            abort(403);
        }

        if (!$user->accessibleShopsQuery()->where('id', $item->shop_id)->exists()) {
            abort(403);
        }

        if ($item->status !== 'pending') {
            return back()->with('error', 'Cet article ne peut pas être approuvé.');
        }

        DB::transaction(function () use ($user, $item) {
            $item->update([
                'status' => 'approved',
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            StockMovementService::recordReturnedInventoryApproval(
                $item->product,
                $item->quantity,
                $item->condition,
                $item->shop_id,
                $item
            );
        });

        return back()->with('success', 'Article approuvé et stock mis à jour.');
    }

    public function reject(string $code_user, ReturnedInventory $item)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'manager'])) {
            abort(403);
        }

        if (!$user->accessibleShopsQuery()->where('id', $item->shop_id)->exists()) {
            abort(403);
        }

        if ($item->status !== 'pending') {
            return back()->with('error', 'Cet article ne peut pas être rejeté.');
        }

        $item->update([
            'status' => 'rejected',
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Retour rejeté. Stock non modifié.');
    }
}
