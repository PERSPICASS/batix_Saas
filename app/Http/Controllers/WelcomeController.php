<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Review;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    /**
     * Display the welcome/landing page.
     */
    public function index(): Response
    {
        $latestPosts = Post::published()
            ->orderByDesc('published_at')
            ->limit(3)
            ->get()
            ->map(fn($post) => [
                'id' => $post->id,
                'slug' => $post->slug,
                'title_fr' => $post->title_fr,
                'title_en' => $post->title_en,
                'excerpt_fr' => $post->excerpt_fr,
                'excerpt_en' => $post->excerpt_en,
                'cover_image' => $post->cover_image,
                'author_name' => $post->author_name,
                'category' => $post->category,
                'published_at' => $post->published_at?->toDateString(),
            ]);

        // Real, admin-approved customer reviews — these replace the fabricated
        // testimonials that were removed. Nothing shows until an admin approves one.
        $reviews = Review::approved()
            ->where('would_recommend', true)
            ->orderByDesc('approved_at')
            ->limit(9)
            ->get()
            ->map(fn (Review $r) => [
                'id' => $r->id,
                'author_name' => $r->author_name,
                'author_company' => $r->author_company,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'would_recommend' => $r->would_recommend,
            ]);

        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
            'appUrl' => rtrim(config('app.url'), '/'),
            'latestPosts' => $latestPosts,
            'reviews' => $reviews,
            'localeLinks' => [
                'fr' => route('welcome'),
                'en' => route('en.welcome'),
            ],
        ]);
    }
}
