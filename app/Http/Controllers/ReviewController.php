<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    /**
     * Create or update the authenticated user's review. It (re)enters moderation
     * as pending — an admin approves it before it appears publicly.
     */
    public function store(string $code_user, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10|max:1000',
            'would_recommend' => 'required|boolean',
        ]);

        $user = Auth::user();

        // Snapshot the reviewer's identity so an approved testimonial stays stable
        // even if they later rename themselves or their shop.
        $activeShopId = get_active_shop_id();
        $shop = $activeShopId
            ? Shop::find($activeShopId)
            : $user->accessibleShops()->first();

        Review::updateOrCreate(
            ['user_id' => $user->id],
            [
                'shop_id' => $shop?->id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'],
                'would_recommend' => $validated['would_recommend'],
                'author_name' => $user->name,
                'author_company' => $shop?->name,
                'status' => Review::STATUS_PENDING,
                'approved_at' => null,
            ]
        );

        return back()->with('success', 'Merci ! Votre avis a été envoyé et sera publié après validation.');
    }
}
