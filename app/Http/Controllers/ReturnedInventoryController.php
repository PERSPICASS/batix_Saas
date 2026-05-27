<?php

namespace App\Http\Controllers;

use App\Models\ReturnedInventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReturnedInventoryController extends Controller
{
    public function index(string $code_user)
    {
        $user = Auth::user();
        if (!$user->accessibleShopsQuery()->exists()) {
            abort(403);
        }

        $items = ReturnedInventory::with(['saleReturn', 'product', 'shop', 'reviewedBy'])
            ->whereIn('shop_id', $user->accessibleShopsQuery()->pluck('id'))
            ->orderBy('status', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate(25);

        return Inertia::render('ReturnedInventory/Index', [
            'items' => $items,
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

        $item->update([
            'status' => 'approved',
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        // Mettre à jour le stock selon la condition
        if ($item->condition === 'good') {
            $item->product->increment('stock_quantity', $item->quantity);
        } else {
            $item->product->increment('defective_stock_quantity', $item->quantity);
        }

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
