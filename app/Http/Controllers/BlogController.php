<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(): Response
    {
        $posts = Post::published()
            ->orderByDesc('published_at')
            ->get()
            ->map(fn($post) => $this->formatPost($post));

        return Inertia::render('Blog/Index', [
            'posts' => $posts,
        ]);
    }

    public function show(string $slug): Response
    {
        $post = Post::published()->where('slug', $slug)->firstOrFail();

        return Inertia::render('Blog/Show', [
            'post' => $this->formatPost($post, true),
        ]);
    }

    private function formatPost(Post $post, bool $withContent = false): array
    {
        $data = [
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
        ];

        if ($withContent) {
            $data['content_fr'] = $post->content_fr;
            $data['content_en'] = $post->content_en;
        }

        return $data;
    }
}
