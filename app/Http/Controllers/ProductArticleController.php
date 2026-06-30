<?php

namespace App\Http\Controllers;

use App\Models\ProductArticle;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductArticleController extends Controller
{
    public function listByProduct(string $code_user, int $productId)
    {
        $product = Product::findOrFail($productId);

        $articles = $product->articles()
            ->where('shop_id', auth()->user()->shop_id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'articles' => $articles,
        ]);
    }

    public function store(Request $request, string $code_user)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'name' => 'required|string|max:255',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $shopId = auth()->user()->shop_id;

        // Vérifier que le produit appartient à la shop de l'utilisateur
        if ($product->shop_id !== $shopId) {
            return response()->json([
                'message' => 'Produit non trouvé',
            ], 404);
        }

        $article = ProductArticle::create([
            'product_id' => $validated['product_id'],
            'shop_id' => $shopId,
            'name' => $validated['name'],
            'status' => 'available',
        ]);

        return response()->json([
            'article' => $article,
            'message' => 'Article créé avec succès',
        ], 201);
    }

    public function updateStatus(Request $request, string $code_user, ProductArticle $productArticle)
    {
        $validated = $request->validate([
            'status' => 'required|in:available,sold,archived',
        ]);

        $shopId = auth()->user()->shop_id;

        if ($productArticle->shop_id !== $shopId) {
            return response()->json([
                'message' => 'Article non trouvé',
            ], 404);
        }

        $productArticle->update(['status' => $validated['status']]);

        return response()->json([
            'article' => $productArticle,
            'message' => 'Statut mis à jour',
        ]);
    }

    public function destroy(string $code_user, ProductArticle $productArticle)
    {
        $shopId = auth()->user()->shop_id;

        if ($productArticle->shop_id !== $shopId) {
            return response()->json([
                'message' => 'Article non trouvé',
            ], 404);
        }

        $productArticle->delete();

        return response()->json([
            'message' => 'Article supprimé',
        ]);
    }

    public function getAvailableByProduct(string $code_user, int $productId)
    {
        $product = Product::findOrFail($productId);
        $shopId = auth()->user()->shop_id;

        if ($product->shop_id !== $shopId) {
            return response()->json([
                'message' => 'Produit non trouvé',
            ], 404);
        }

        $articles = $product->articles()
            ->where('shop_id', $shopId)
            ->available()
            ->get(['id', 'name']);

        return response()->json([
            'articles' => $articles,
        ]);
    }
}
