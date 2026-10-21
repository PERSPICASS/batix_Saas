<?php

namespace App\Http\Controllers;

use App\Models\ProductAttribute;
use App\Models\ProductAttributeValue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProductAttributeController extends Controller
{
    /**
     * Afficher la liste des attributs de la boutique.
     */
    public function index()
    {
        $shop = current_shop();
        
        if (!$shop) {
            return redirect()->route('shops.index')->with('error', 'Veuillez sélectionner une boutique.');
        }

        $attributes = ProductAttribute::where('shop_id', $shop->id)
            ->with('values')
            ->orderBy('order')
            ->orderBy('name')
            ->get();

        return Inertia::render('ProductAttributes/Index', [
            'attributes' => $attributes,
        ]);
    }

    /**
     * Créer un nouvel attribut.
     */
    public function store(Request $request)
    {
        $shop = current_shop();
        
        if (!$shop) {
            return back()->with('error', 'Veuillez sélectionner une boutique.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        $attribute = ProductAttribute::create([
            'shop_id' => $shop->id,
            'name' => $validated['name'],
            'order' => $validated['order'] ?? 0,
        ]);

        return back()->with('success', "Attribut \"{$attribute->name}\" créé avec succès.");
    }

    /**
     * Mettre à jour un attribut.
     */
    public function update(Request $request, string $code_user, ProductAttribute $attribute)
    {
        $shop = current_shop();
        
        if (!$shop || $attribute->shop_id !== $shop->id) {
            return back()->with('error', 'Accès non autorisé.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        $attribute->update([
            'name' => $validated['name'],
            'order' => $validated['order'] ?? $attribute->order,
        ]);

        return back()->with('success', "Attribut \"{$attribute->name}\" mis à jour.");
    }

    /**
     * Supprimer un attribut.
     */
    public function destroy(string $code_user, ProductAttribute $attribute)
    {
        $shop = current_shop();
        
        if (!$shop || $attribute->shop_id !== $shop->id) {
            return back()->with('error', 'Accès non autorisé.');
        }

        $name = $attribute->name;
        $attribute->delete();

        return back()->with('success', "Attribut \"{$name}\" supprimé.");
    }

    /**
     * Ajouter une valeur à un attribut.
     */
    public function addValue(Request $request, string $code_user, ProductAttribute $attribute)
    {
        $shop = current_shop();
        
        if (!$shop || $attribute->shop_id !== $shop->id) {
            return back()->with('error', 'Accès non autorisé.');
        }

        $validated = $request->validate([
            'value' => 'required|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        $value = ProductAttributeValue::create([
            'attribute_id' => $attribute->id,
            'value' => $validated['value'],
            'order' => $validated['order'] ?? 0,
        ]);

        return back()->with('success', "Valeur \"{$value->value}\" ajoutée à l'attribut \"{$attribute->name}\".");
    }

    /**
     * Mettre à jour une valeur d'attribut.
     */
    public function updateValue(Request $request, string $code_user, ProductAttributeValue $value)
    {
        $shop = current_shop();
        
        if (!$shop || $value->attribute->shop_id !== $shop->id) {
            return back()->with('error', 'Accès non autorisé.');
        }

        $validated = $request->validate([
            'value' => 'required|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        $value->update([
            'value' => $validated['value'],
            'order' => $validated['order'] ?? $value->order,
        ]);

        return back()->with('success', "Valeur mise à jour.");
    }

    /**
     * Supprimer une valeur d'attribut.
     */
    public function destroyValue(string $code_user, ProductAttributeValue $value)
    {
        $shop = current_shop();
        
        if (!$shop || $value->attribute->shop_id !== $shop->id) {
            return back()->with('error', 'Accès non autorisé.');
        }

        $valueName = $value->value;
        $value->delete();

        return back()->with('success', "Valeur \"{$valueName}\" supprimée.");
    }
}
