<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Support\HtmlSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BlogAdminController extends Controller
{
    public function index(): Response
    {
        $posts = Post::orderByDesc('created_at')
            ->get()
            ->map(fn($post) => [
                'id' => $post->id,
                'slug' => $post->slug,
                'title_fr' => $post->title_fr,
                'title_en' => $post->title_en,
                'cover_image' => $post->cover_image,
                'author_name' => $post->author_name,
                'category' => $post->category,
                'is_published' => $post->is_published,
                'published_at' => $post->published_at?->toDateString(),
                'created_at' => $post->created_at->toDateString(),
            ]);

        return Inertia::render('PlatformAdmin/Blog/Index', [
            'posts' => $posts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('PlatformAdmin/Blog/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title_fr'    => 'required|string|max:255',
            'title_en'    => 'nullable|string|max:255',
            'excerpt_fr'  => 'nullable|string|max:500',
            'excerpt_en'  => 'nullable|string|max:500',
            'content_fr'  => 'required|string',
            'content_en'  => 'nullable|string',
            'author_name' => 'nullable|string|max:100',
            'category'    => 'nullable|string|max:100',
            'is_published' => 'boolean',
            'cover_image' => 'nullable|image|max:2048',
        ]);

        $data['content_fr'] = HtmlSanitizer::sanitize($data['content_fr']);
        $data['content_en'] = HtmlSanitizer::sanitize($data['content_en'] ?? null);

        $data['slug'] = Post::generateSlug($data['title_fr']);
        $data['author_name'] = $data['author_name'] ?? 'BATIX PRO';

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('blog', 'public');
        }

        if (!empty($data['is_published'])) {
            $data['published_at'] = now();
        }

        Post::create($data);

        return redirect()->route('platform.blog.index')->with('success', 'Article créé avec succès.');
    }

    public function edit(Post $post): Response
    {
        return Inertia::render('PlatformAdmin/Blog/Edit', [
            'post' => [
                'id' => $post->id,
                'slug' => $post->slug,
                'title_fr' => $post->title_fr,
                'title_en' => $post->title_en,
                'excerpt_fr' => $post->excerpt_fr,
                'excerpt_en' => $post->excerpt_en,
                'content_fr' => $post->content_fr,
                'content_en' => $post->content_en,
                'cover_image' => $post->cover_image,
                'author_name' => $post->author_name,
                'category' => $post->category,
                'is_published' => $post->is_published,
            ],
        ]);
    }

    public function update(Request $request, Post $post)
    {
        $data = $request->validate([
            'title_fr'    => 'required|string|max:255',
            'title_en'    => 'nullable|string|max:255',
            'excerpt_fr'  => 'nullable|string|max:500',
            'excerpt_en'  => 'nullable|string|max:500',
            'content_fr'  => 'required|string',
            'content_en'  => 'nullable|string',
            'author_name' => 'nullable|string|max:100',
            'category'    => 'nullable|string|max:100',
            'is_published' => 'boolean',
            'cover_image' => 'nullable|image|max:2048',
        ]);

        $data['content_fr'] = HtmlSanitizer::sanitize($data['content_fr']);
        $data['content_en'] = HtmlSanitizer::sanitize($data['content_en'] ?? null);

        $data['author_name'] = $data['author_name'] ?? 'BATIX PRO';

        if ($request->hasFile('cover_image')) {
            if ($post->cover_image) {
                Storage::disk('public')->delete($post->cover_image);
            }
            $data['cover_image'] = $request->file('cover_image')->store('blog', 'public');
        }

        if (!empty($data['is_published']) && !$post->published_at) {
            $data['published_at'] = now();
        } elseif (empty($data['is_published'])) {
            $data['published_at'] = null;
        }

        $post->update($data);

        return redirect()->route('platform.blog.index')->with('success', 'Article mis à jour.');
    }

    public function destroy(Post $post)
    {
        if ($post->cover_image) {
            Storage::disk('public')->delete($post->cover_image);
        }
        $post->delete();

        return redirect()->route('platform.blog.index')->with('success', 'Article supprimé.');
    }

    public function togglePublished(Post $post)
    {
        $post->is_published = !$post->is_published;
        $post->published_at = $post->is_published ? ($post->published_at ?? now()) : null;
        $post->save();

        return back()->with('success', $post->is_published ? 'Article publié.' : 'Article dépublié.');
    }
}
