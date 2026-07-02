<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     * 
     * Les catégories sont globales (prédéfinies par la plateforme)
     */
    public function index(Request $request): Response
    {
        // Les catégories sont globales - pas de filtre par boutique
        $categories = Category::with('subcategories')
            ->orderBy('order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'shops' => Auth::user()->accessibleShops(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     * 
     * Note: La création de catégories pourrait être réservée aux admins
     */
    public function create(): Response
    {
        return Inertia::render('Categories/Create', [
            'shops' => Auth::user()->accessibleShops(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:255',
            'order' => 'nullable|integer',
        ]);

        // Vérifier que la boutique appartient à l'utilisateur
        $shop = Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        
        $category = $shop->categories()->create($validated);

        // Log activity
        ActivityLogger::created($category, $category->name);

        return redirect()->route('categories.index', ['code_user' => request()->route('code_user')])->with('success', 'Catégorie créée avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $code_user, Category $category)
    {
        $this->authorize('view', $category);
        
        $category->load(['subcategories', 'products']);
        
        return Inertia::render('Categories/Show', [
            'category' => $category,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $code_user, Category $category): Response
    {
        $this->authorize('update', $category);
        
        return Inertia::render('Categories/Edit', [
            'category' => $category,
            'shops' => Auth::user()->accessibleShops(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $code_user, Category $category)
    {
        $this->authorize('update', $category);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:255',
            'order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        // Log activity
        ActivityLogger::updated($category, [], $category->name);

        return redirect()->route('categories.index', ['code_user' => request()->route('code_user')])->with('success', 'Catégorie mise à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $code_user, Category $category)
    {
        $this->authorize('delete', $category);
        
        // Sauvegarder le nom avant suppression
        $categoryName = $category->name;
        
        $category->delete();

        // Log activity
        ActivityLogger::deleted($category, $categoryName);

        return redirect()->route('categories.index', ['code_user' => request()->route('code_user')])->with('success', 'Catégorie supprimée avec succès.');
    }
}
