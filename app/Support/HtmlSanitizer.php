<?php

namespace App\Support;

use HTMLPurifier;
use HTMLPurifier_Config;

/**
 * Sanitizes rich-text HTML produced by the TipTap editor (blog post bodies) before
 * it's stored and later rendered via dangerouslySetInnerHTML on the public site.
 * Without this, a compromised/phished platform-admin session could inject a
 * stored XSS served to every blog visitor.
 */
class HtmlSanitizer
{
    private static ?HTMLPurifier $purifier = null;

    public static function sanitize(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        return self::purifier()->purify($html);
    }

    private static function purifier(): HTMLPurifier
    {
        if (self::$purifier !== null) {
            return self::$purifier;
        }

        $config = HTMLPurifier_Config::createDefault();
        $config->set('Cache.DefinitionImpl', null);
        $config->set('HTML.Allowed', implode(',', [
            'p', 'br', 'hr',
            'strong', 'b', 'em', 'i', 'u', 's', 'code',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'blockquote', 'pre',
            'a[href|title|target|rel]',
            'img[src|alt|width|height]',
            'span', 'div',
        ]));
        $config->set('HTML.TargetBlank', true);
        $config->set('URI.AllowedSchemes', ['http' => true, 'https' => true, 'mailto' => true]);

        return self::$purifier = new HTMLPurifier($config);
    }
}
