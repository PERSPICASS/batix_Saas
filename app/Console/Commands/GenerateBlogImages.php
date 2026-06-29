<?php

namespace App\Console\Commands;

use App\Models\Post;
use Illuminate\Console\Command;

class GenerateBlogImages extends Command
{
    protected $signature = 'blog:generate-images';
    protected $description = 'Generate cohesive header images for all blog posts';

    public function handle()
    {
        $posts = Post::where('is_published', true)->get();

        if ($posts->isEmpty()) {
            $this->error('No published posts found');
            return;
        }

        $this->info("Generating images for {$posts->count()} blog posts...\n");

        foreach ($posts as $post) {
            try {
                $this->generateImage($post);
                $this->info("✓ Generated image for: {$post->title_fr}");
            } catch (\Exception $e) {
                $this->error("✗ Failed to generate image for {$post->slug}: {$e->getMessage()}");
            }
        }

        $this->info("\nBlog images generated successfully!");
    }

    private function generateImage(Post $post)
    {
        // Image dimensions
        $width = 1200;
        $height = 630;

        // Create a blank image
        $image = imagecreatetruecolor($width, $height);

        // Define color scheme based on category
        $colors = $this->getCategoryColors($post->category);
        $bgColor = imagecolorallocate($image, $colors['bg_r'], $colors['bg_g'], $colors['bg_b']);
        $accentColor = imagecolorallocate($image, $colors['accent_r'], $colors['accent_g'], $colors['accent_b']);
        $textColor = imagecolorallocate($image, 255, 255, 255);
        $subtextColor = imagecolorallocate($image, 220, 220, 220);

        // Fill background with gradient effect
        for ($y = 0; $y < $height; $y++) {
            $ratio = $y / $height;
            $r = (int)($colors['bg_r'] + ($colors['accent_r'] - $colors['bg_r']) * $ratio * 0.3);
            $g = (int)($colors['bg_g'] + ($colors['accent_g'] - $colors['bg_g']) * $ratio * 0.3);
            $b = (int)($colors['bg_b'] + ($colors['accent_b'] - $colors['bg_b']) * $ratio * 0.3);
            $lineColor = imagecolorallocate($image, $r, $g, $b);
            imageline($image, 0, $y, $width, $y, $lineColor);
        }

        // Draw accent bar
        $barHeight = 8;
        $accentBar = imagecolorallocate($image, $colors['accent_r'], $colors['accent_g'], $colors['accent_b']);
        imagefilledrectangle($image, 0, 0, $width, $barHeight, $accentBar);

        // Add category badge
        $categoryText = strtoupper($post->category);
        $this->drawBadge($image, $categoryText, $colors, $textColor);

        // Add title - wrap text
        $titleLines = $this->wrapText($post->title_fr, 85);
        $startY = 250;
        $lineHeight = 70;

        foreach ($titleLines as $line) {
            $this->drawText($image, $line, 60, $startY, $textColor, 5);
            $startY += $lineHeight;
        }

        // Add BATIX logo/branding at bottom
        $this->drawBranding($image, $subtextColor);

        // Save image
        $imagePath = public_path('images/blog/' . $post->slug . '.jpg');
        imagejpeg($image, $imagePath, 90);
        imagedestroy($image);

        // Update post with image path
        $post->update(['cover_image' => '/images/blog/' . $post->slug . '.jpg']);
    }

    private function getCategoryColors($category)
    {
        $colors = [
            'Guides' => [
                'bg_r' => 59, 'bg_g' => 130, 'bg_b' => 246,      // Blue
                'accent_r' => 37, 'accent_g' => 99, 'accent_b' => 235,
            ],
            'Croissance' => [
                'bg_r' => 34, 'bg_g' => 197, 'bg_b' => 94,       // Green
                'accent_r' => 22, 'accent_g' => 163, 'accent_b' => 74,
            ],
            'Comparatifs' => [
                'bg_r' => 251, 'bg_g' => 146, 'bg_b' => 60,      // Orange
                'accent_r' => 230, 'accent_g' => 124, 'accent_b' => 34,
            ],
            'Tutoriels' => [
                'bg_r' => 156, 'bg_g' => 39, 'bg_b' => 176,      // Purple
                'accent_r' => 123, 'accent_g' => 31, 'accent_b' => 162,
            ],
        ];

        return $colors[$category] ?? $colors['Guides'];
    }

    private function wrapText($text, $maxChars)
    {
        $words = explode(' ', $text);
        $lines = [];
        $currentLine = '';

        foreach ($words as $word) {
            if (strlen($currentLine . ' ' . $word) <= $maxChars) {
                $currentLine .= ($currentLine ? ' ' : '') . $word;
            } else {
                if ($currentLine) {
                    $lines[] = $currentLine;
                }
                $currentLine = $word;
            }
        }

        if ($currentLine) {
            $lines[] = $currentLine;
        }

        return $lines;
    }

    private function drawText(&$image, $text, $size, $y, $color, $fontFile)
    {
        // Use built-in fonts since custom fonts might not be available
        $fontPath = __DIR__ . '/../../fonts/';
        $x = 50;

        // Simple text drawing with imagestring as fallback
        imagestring($image, $fontFile, $x, $y, $text, $color);
    }

    private function drawBadge(&$image, $text, $colors, $textColor)
    {
        // Draw a simple badge at top right
        $badgeColor = imagecolorallocate($image, $colors['accent_r'], $colors['accent_g'], $colors['accent_b']);
        $x = 900;
        $y = 50;
        imagefilledrectangle($image, $x, $y, $x + 250, $y + 50, $badgeColor);
        imagestring($image, 3, $x + 20, $y + 15, $text, $textColor);
    }

    private function drawBranding(&$image, $textColor)
    {
        // Draw BATIX branding at bottom
        $width = imagesx($image);
        $height = imagesy($image);
        imagestring($image, 2, 50, $height - 40, 'BATIX PRO', $textColor);
    }
}
