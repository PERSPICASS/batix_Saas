<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url'), '/');

        $blogLastmod = Post::published()->max('published_at');

        $staticUrls = [
            [
                'loc'        => $baseUrl . '/',
                'lastmod'    => now()->format('Y-m-d'),
                'changefreq' => 'weekly',
                'priority'   => '1.0',
            ],
            [
                'loc'        => $baseUrl . '/blog',
                'lastmod'    => $blogLastmod ? substr($blogLastmod, 0, 10) : now()->format('Y-m-d'),
                'changefreq' => 'daily',
                'priority'   => '0.8',
            ],
        ];

        $posts = Post::published()
            ->orderByDesc('published_at')
            ->get(['slug', 'updated_at', 'published_at']);

        $content = view('sitemap', [
            'baseUrl'    => $baseUrl,
            'staticUrls' => $staticUrls,
            'posts'      => $posts,
        ])->render();

        return response($content, 200)
            ->header('Content-Type', 'application/xml; charset=utf-8');
    }
}
