<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SubcategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $shopId = $request->input('shop_id');
        $categoryId = $request->input('category_id');
        
        $query = Subcategory::with('category.shop')
            ->orderBy('order')
            ->orderBy('name');

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        } else {
            // Afficher les sous-catégories des boutiques de l'utilisateur
            $query->whereHas('category.shop', function ($q) {
                $q->where('user_id', Auth::id());
            });
        }

        $subcategories = $query->get();

        // Récupérer les catégories pour le filtre
        $categories = Category::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->get();

        return Inertia::render('Subcategories/Index', [
            'subcategories' => $subcategories,
            'categories' => $categories,
            'shops' => Auth::user()->accessibleShops(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $categories = Category::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->with('shop')->get();

        return Inertia::render('Subcategories/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
        ]);

        // Vérifier que la catégorie appartient à une boutique de l'utilisateur
        $category = Category::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->findOrFail($validated['category_id']);
        
        $category->subcategories()->create($validated);

        return redirect()->route('subcategories.index')->with('success', 'Sous-catégorie créée avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Subcategory $subcategory)
    {
        $this->authorize('view', $subcategory);
        
        $subcategory->load(['category', 'products']);
        
        return Inertia::render('Subcategories/Show', [
            'subcategory' => $subcategory,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Subcategory $subcategory): Response
    {
        $this->authorize('update', $subcategory);
        
        $categories = Category::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->with('shop')->get();
        
        return Inertia::render('Subcategories/Edit', [
            'subcategory' => $subcategory,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Subcategory $subcategory)
    {
        $this->authorize('update', $subcategory);
        
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $subcategory->update($validated);

        return redirect()->route('subcategories.index')->with('success', 'Sous-catégorie mise à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subcategory $subcategory)
    {
        $this->authorize('delete', $subcategory);
        
        $subcategory->delete();

        return redirect()->route('subcategories.index')->with('success', 'Sous-catégorie supprimée avec succès.');
    }
}
