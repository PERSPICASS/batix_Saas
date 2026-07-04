<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Shop;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $activeShopId = get_active_shop_id();
        $codeUser = $request->route('code_user');

        $query = Expense::where('shop_id', $activeShopId)
            ->with('user');

        // Filtre recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Filtre catégorie
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Filtre mode de paiement
        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }

        // Filtre date de début
        if ($request->filled('date_from')) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }

        // Filtre date de fin
        if ($request->filled('date_to')) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        $expenses = $query->orderBy('expense_date', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Total des dépenses filtrées (sans pagination)
        $totalQuery = Expense::where('shop_id', $activeShopId);
        if ($request->filled('search')) {
            $search = $request->search;
            $totalQuery->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }
        if ($request->filled('category') && $request->category !== 'all') {
            $totalQuery->where('category', $request->category);
        }
        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $totalQuery->where('payment_method', $request->payment_method);
        }
        if ($request->filled('date_from')) {
            $totalQuery->whereDate('expense_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $totalQuery->whereDate('expense_date', '<=', $request->date_to);
        }
        $totalAmount = $totalQuery->sum('amount');

        // Total du mois courant
        $monthTotal = Expense::where('shop_id', $activeShopId)
            ->whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->sum('amount');

        $shop = Shop::find($activeShopId);

        return Inertia::render('Expenses/Index', [
            'code_user'    => $codeUser,
            'expenses'     => $expenses,
            'totalAmount'  => (float) $totalAmount,
            'monthTotal'   => (float) $monthTotal,
            'currency'     => $shop?->currency ?? 'XOF',
            'filters'      => $request->only(['search', 'category', 'payment_method', 'date_from', 'date_to']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $activeShopId = get_active_shop_id();
        $codeUser = $request->route('code_user');

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'amount'         => 'required|numeric|min:0.01',
            'category'       => 'required|string|max:100',
            'expense_date'   => 'required|date',
            'payment_method' => 'nullable|string|in:cash,card,transfer,check,mobile',
            'reference'      => 'nullable|string|max:100',
            'notes'          => 'nullable|string|max:1000',
            'receipt'        => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('receipts', 'public');
        }

        $expense = Expense::create([
            'shop_id'        => $activeShopId,
            'user_id'        => Auth::id(),
            'title'          => $validated['title'],
            'amount'         => $validated['amount'],
            'category'       => $validated['category'],
            'expense_date'   => $validated['expense_date'],
            'payment_method' => $validated['payment_method'] ?? null,
            'reference'      => $validated['reference'] ?? null,
            'notes'          => $validated['notes'] ?? null,
            'receipt'        => $receiptPath,
        ]);

        ActivityLogger::created($expense, "{$expense->title} ({$expense->amount})");

        return redirect()
            ->route('expenses.index', ['code_user' => $codeUser])
            ->with('success', 'Dépense enregistrée avec succès.');
    }

    public function update(Request $request, Expense $expense): RedirectResponse
    {
        $codeUser = $request->route('code_user');

        if (!Auth::user()->accessibleShopsQuery()->where('id', $expense->shop_id)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'amount'         => 'required|numeric|min:0.01',
            'category'       => 'required|string|max:100',
            'expense_date'   => 'required|date',
            'payment_method' => 'nullable|string|in:cash,card,transfer,check,mobile',
            'reference'      => 'nullable|string|max:100',
            'notes'          => 'nullable|string|max:1000',
            'receipt'        => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($request->hasFile('receipt')) {
            // Supprimer l'ancien justificatif
            if ($expense->receipt) {
                Storage::disk('public')->delete($expense->receipt);
            }
            $validated['receipt'] = $request->file('receipt')->store('receipts', 'public');
        } else {
            unset($validated['receipt']);
        }

        $expense->update($validated);

        ActivityLogger::updated($expense, [], $expense->title);

        return redirect()
            ->route('expenses.index', ['code_user' => $codeUser])
            ->with('success', 'Dépense modifiée avec succès.');
    }

    public function destroy(Request $request, Expense $expense): RedirectResponse
    {
        $codeUser = $request->route('code_user');

        if (!Auth::user()->accessibleShopsQuery()->where('id', $expense->shop_id)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        // Supprimer le justificatif si présent
        if ($expense->receipt) {
            Storage::disk('public')->delete($expense->receipt);
        }

        ActivityLogger::deleted($expense, $expense->title);
        $expense->delete();

        return redirect()
            ->route('expenses.index', ['code_user' => $codeUser])
            ->with('success', 'Dépense supprimée.');
    }
}
