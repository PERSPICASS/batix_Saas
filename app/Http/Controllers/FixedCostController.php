<?php

namespace App\Http\Controllers;

use App\Models\FixedCost;
use App\Services\PlatformMetrics;
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
        // In FCFA, annual costs spread over 12 months (the stored amount is
        // per billing cycle, in the cost's own currency).
        $totalMonthly = round(app(PlatformMetrics::class)->monthlyFixedCosts());

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
            'currency' => 'required|in:EUR,USD,FCFA',
            'billing_cycle' => 'required|in:monthly,annual',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        FixedCost::create($validated);

        return redirect()->route('platform.fixed-costs.index')->with('success', __('platform.flash.cost_created'));
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
            'currency' => 'required|in:EUR,USD,FCFA',
            'billing_cycle' => 'required|in:monthly,annual',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $cost->update($validated);

        return redirect()->route('platform.fixed-costs.index')->with('success', __('platform.flash.cost_updated'));
    }

    public function destroy(FixedCost $cost)
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $cost->delete();

        return redirect()->route('platform.fixed-costs.index')->with('success', __('platform.flash.cost_deleted'));
    }
}
