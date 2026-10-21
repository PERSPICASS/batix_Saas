<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Les traductions serveur vivent dans resources/lang : le dossier lang/ à la racine
 * n'était jamais chargé, et toutes les erreurs de validation et de connexion
 * s'affichaient en anglais aux utilisateurs francophones. On vérifie le texte
 * rendu, pas seulement qu'une erreur existe.
 */
class ServerTranslationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app()->setLocale('fr');
    }

    public function test_wrong_credentials_message_is_french(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-password')]);

        $this->post('/login', ['email' => $user->email, 'password' => 'wrong-password'])
            ->assertSessionHasErrors(['email' => 'Ces identifiants ne correspondent à aucun compte.']);
    }

    public function test_validation_messages_are_french_with_translated_attributes(): void
    {
        $this->post('/login', ['email' => '', 'password' => ''])
            ->assertSessionHasErrors([
                'email' => 'Le champ adresse e-mail est obligatoire.',
                'password' => 'Le champ mot de passe est obligatoire.',
            ]);
    }

    public function test_every_framework_validation_rule_has_a_french_message(): void
    {
        $english = require base_path('vendor/laravel/framework/src/Illuminate/Translation/lang/en/validation.php');
        unset($english['custom'], $english['attributes']);

        foreach (array_keys($english) as $rule) {
            $this->assertNotSame("validation.$rule", __("validation.$rule"), "validation.$rule manque");
            $this->assertNotEquals($english[$rule], __("validation.$rule"), "validation.$rule est en anglais");
        }
    }
}
