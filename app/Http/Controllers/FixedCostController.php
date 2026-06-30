<?php

namespace App\Http\Controllers;

use App\Models\FixedCost;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FixedCostController extends Controller
{
    public function index()
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $costs = FixedCost::orderBy('category')->get();
        $totalMonthly = $costs->where('is_active', true)->sum('amount_monthly');

        return Inertia::render('PlatformAdmin/FixedCosts/Index', [
            'costs' => $costs,
            'total_monthly' => $totalMonthly,
        ]);
    }

    public function create()
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        return Inertia::render('PlatformAdmin/FixedCosts/Create');
    }

    public function store(Request $request)
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'amount_monthly' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        FixedCost::create($validated);

        return redirect()->route('platform.fixed-costs.index')->with('success', 'Charge ajoutée avec succès.');
    }

    public function edit(FixedCost $cost)
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        return Inertia::render('PlatformAdmin/FixedCosts/Edit', [
            'cost' => $cost,
        ]);
    }

    public function update(Request $request, FixedCost $cost)
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'amount_monthly' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $cost->update($validated);

        return redirect()->route('platform.fixed-costs.index')->with('success', 'Charge mise à jour.');
    }

    public function destroy(FixedCost $cost)
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $cost->delete();

        return redirect()->route('platform.fixed-costs.index')->with('success', 'Charge supprimée.');
    }
}
