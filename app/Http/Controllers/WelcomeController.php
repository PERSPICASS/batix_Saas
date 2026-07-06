<?php

namespace App\Http\Controllers;

use App\Models\Post;
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

        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
            'appUrl' => rtrim(config('app.url'), '/'),
            'latestPosts' => $latestPosts,
            'localeLinks' => [
                'fr' => route('welcome'),
                'en' => route('en.welcome'),
            ],
        ]);
    }
}
