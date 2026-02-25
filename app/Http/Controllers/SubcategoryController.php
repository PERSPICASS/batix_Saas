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
     * 
     * Les catégories et sous-catégories sont globales (prédéfinies par la plateforme)
     */
    public function index(Request $request): Response
    {
        $categoryId = $request->input('category_id');
        
        $query = Subcategory::with('category')
            ->orderBy('order')
            ->orderBy('name');

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $subcategories = $query->get();

        // Récupérer les catégories globales pour le filtre
        $categories = Category::orderBy('order')->orderBy('name')->get();

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
        // Les catégories sont globales
        $categories = Category::orderBy('order')->orderBy('name')->get();

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

        // Les catégories sont globales, pas besoin de vérifier le propriétaire
        $category = Category::findOrFail($validated['category_id']);
        
        $category->subcategories()->create($validated);

        return redirect()->route('subcategories.index', ['code_user' => request()->route('code_user')])->with('success', 'Sous-catégorie créée avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $code_user, Subcategory $subcategory)
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
    public function edit(string $code_user, Subcategory $subcategory): Response
    {
        $this->authorize('update', $subcategory);
        
        // Les catégories sont globales
        $categories = Category::orderBy('order')->orderBy('name')->get();
        
        return Inertia::render('Subcategories/Edit', [
            'subcategory' => $subcategory,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $code_user, Subcategory $subcategory)
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

        return redirect()->route('subcategories.index', ['code_user' => request()->route('code_user')])->with('success', 'Sous-catégorie mise à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $code_user, Subcategory $subcategory)
    {
        $this->authorize('delete', $subcategory);
        
        $subcategory->delete();

        return redirect()->route('subcategories.index', ['code_user' => request()->route('code_user')])->with('success', 'Sous-catégorie supprimée avec succès.');
    }
}
