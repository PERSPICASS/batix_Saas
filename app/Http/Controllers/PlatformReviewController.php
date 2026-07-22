<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PlatformReviewController extends Controller
{
    private function guard(): void
    {
        // Defensive: the route already carries the platform.admin middleware, but
        // every platform controller repeats the check (see FixedCostController).
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }
    }

    public function index(): Response
    {
        $this->guard();

        $reviews = Review::latest()->get()->map(fn (Review $r) => [
            'id' => $r->id,
            'author_name' => $r->author_name,
            'author_company' => $r->author_company,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'would_recommend' => $r->would_recommend,
            'status' => $r->status,
            'created_at' => $r->created_at?->toDateTimeString(),
        ]);

        return Inertia::render('PlatformAdmin/Reviews/Index', [
            'reviews' => $reviews,
            'counts' => [
                'pending' => Review::pending()->count(),
                'approved' => Review::approved()->count(),
                'total' => Review::count(),
            ],
        ]);
    }

    public function approve(Review $review): RedirectResponse
    {
        $this->guard();

        $review->update([
            'status' => Review::STATUS_APPROVED,
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Avis approuvé et publié.');
    }

    public function reject(Review $review): RedirectResponse
    {
        $this->guard();

        $review->update([
            'status' => Review::STATUS_REJECTED,
            'approved_at' => null,
        ]);

        return back()->with('success', 'Avis rejeté.');
    }

    public function destroy(Review $review): RedirectResponse
    {
        $this->guard();

        $review->delete();

        return back()->with('success', 'Avis supprimé.');
    }
}
