<?php

namespace Tests\Feature\Mail;

use Illuminate\Mail\Markdown;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\View;
use Tests\TestCase;

/**
 * L'en-tete des mails etait le stub vendor de Laravel, non personnalise : il rendait
 * config('app.name') en texte brut ("BATIXPRO"), derriere une branche
 * `@if (trim($slot) === 'Laravel')` morte chez nous — elle sert le logo de laravel.com,
 * et ne se declencherait que si l'application s'appelait "Laravel".
 *
 * Il porte desormais le vrai bloc-marque. Le risque a verrouiller est la republication
 * du vendor (`artisan vendor:publish --tag=laravel-mail --force`), qui ecraserait le
 * fichier sans rien casser : les mails repartiraient en texte brut, avec la branche
 * laravel.com de retour, et aucun test ne broncherait.
 */
class MailHeaderBrandingTest extends TestCase
{
    private const TEMPLATE = 'resources/views/vendor/mail/html/header.blade.php';

    private function renderHeader(): string
    {
        // Le namespace de vues `mail` n'est enregistre que par Markdown au moment du
        // rendu : sans cette ligne, tout <x-mail::...> leve
        // "No hint path defined for [mail]". On le pose ici pour tester l'en-tete seul,
        // sans dependre d'un mailable metier (donc de la base).
        View::replaceNamespace('mail', app(Markdown::class)->htmlComponentPaths());

        return Blade::render('<x-mail::message>Corps</x-mail::message>');
    }

    public function test_the_mail_header_shows_our_logo_and_not_the_app_name_in_text(): void
    {
        $html = $this->renderHeader();

        $this->assertStringContainsString('/images/logo-batixpro.png', $html);
        $this->assertStringContainsString('alt="BATIX PRO"', $html);
    }

    public function test_the_logo_url_is_absolute(): void
    {
        // Un client mail ne resout pas les chemins relatifs : sans hote, l'image
        // apparait cassee dans toutes les boites de reception.
        $html = $this->renderHeader();

        $this->assertStringContainsString(
            rtrim(config('app.url'), '/').'/images/logo-batixpro.png',
            $html
        );
        $this->assertStringNotContainsString('src="/images/', $html);
    }

    public function test_the_published_template_carries_no_trace_of_the_vendor_stub(): void
    {
        // Assertion sur la source, pas sur le rendu : la branche laravel.com du stub est
        // inerte tant que APP_NAME n'est pas "Laravel", donc un rendu ne la verrait pas
        // revenir. C'est bien le fichier qu'on veut voir rester personnalise.
        $source = file_get_contents(base_path(self::TEMPLATE));

        $this->assertStringNotContainsString('laravel.com', $source);
        $this->assertStringNotContainsString("=== 'Laravel'", $source);
    }
}
