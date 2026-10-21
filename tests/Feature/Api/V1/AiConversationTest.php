<?php

namespace Tests\Feature\Api\V1;

use App\Models\AiConversation;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Historique de l'assistant IA : appartenance, purge, titrage.
 *
 * L'enjeu principal est le cloisonnement. Une conversation appartient à un UTILISATEUR
 * dans une BOUTIQUE, et l'identifiant transite par le navigateur : sans contrôle, changer
 * un chiffre dans la requête suffirait à lire le fil d'un collègue — avec ses clients,
 * ses prix et ses marges. Un contrôle de rôle n'y suffirait pas, `super_admin` étant
 * attribué à chaque inscription.
 */
class AiConversationTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop} */
    private function ownerWithShop(): array
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        return [$user, $shop];
    }

    private function conversationFor(User $user, Shop $shop, string $title = 'Devis Matthieu', ?string $lastMessageAt = null): AiConversation
    {
        $conversation = AiConversation::create([
            'user_id' => $user->id,
            'shop_id' => $shop->id,
            'title' => $title,
            'last_message_at' => $lastMessageAt ?? now(),
        ]);

        $conversation->messages()->create(['role' => 'user', 'content' => 'Fais un devis']);
        $conversation->messages()->create(['role' => 'assistant', 'content' => 'Devis créé.']);

        return $conversation;
    }

    // ------------------------------------------------------------- cloisonnement

    public function test_the_scope_isolates_each_user_within_a_shop(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        $colleague = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);

        $mine = $this->conversationFor($owner, $shop, 'Mon fil');
        $theirs = $this->conversationFor($colleague, $shop, 'Le fil du collègue');

        $visible = AiConversation::ownedBy($owner->id, $shop->id)->pluck('id');

        // Même boutique, mais un employé et son responsable n'ont pas à se relire.
        $this->assertTrue($visible->contains($mine->id));
        $this->assertFalse($visible->contains($theirs->id));
    }

    public function test_the_scope_isolates_each_shop_for_one_user(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        $otherShop = Shop::factory()->create(['user_id' => $owner->id]);

        $here = $this->conversationFor($owner, $shop, 'Ici');
        $elsewhere = $this->conversationFor($owner, $otherShop, 'Ailleurs');

        $visible = AiConversation::ownedBy($owner->id, $shop->id)->pluck('id');

        // L'assistant force la boutique courante sur chaque appel d'outil : rouvrir le
        // fil d'une autre boutique afficherait des réponses sans rapport avec l'écran.
        $this->assertTrue($visible->contains($here->id));
        $this->assertFalse($visible->contains($elsewhere->id));
    }

    // --------------------------------------------------------------------- purge

    public function test_purge_removes_only_conversations_past_the_retention_window(): void
    {
        [$owner, $shop] = $this->ownerWithShop();

        $recent = $this->conversationFor($owner, $shop, 'Récente', now()->subDays(10)->toDateTimeString());
        $stale = $this->conversationFor($owner, $shop, 'Ancienne', now()->subDays(120)->toDateTimeString());

        $this->artisan('ai:purge-conversations')->assertSuccessful();

        $this->assertNotNull(AiConversation::find($recent->id));
        $this->assertNull(AiConversation::find($stale->id));
    }

    public function test_purge_takes_the_messages_with_it(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        $stale = $this->conversationFor($owner, $shop, 'Ancienne', now()->subDays(120)->toDateTimeString());

        $this->artisan('ai:purge-conversations')->assertSuccessful();

        // La suppression de masse ne déclenche aucun événement Eloquent : c'est la
        // cascade de la clé étrangère, en base, qui doit emporter les messages. Sans
        // elle, le contenu resterait après la purge — l'inverse de ce qu'on cherche.
        $this->assertDatabaseMissing('ai_messages', ['ai_conversation_id' => $stale->id]);
    }

    public function test_dry_run_deletes_nothing(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        $stale = $this->conversationFor($owner, $shop, 'Ancienne', now()->subDays(120)->toDateTimeString());

        $this->artisan('ai:purge-conversations --dry-run')->assertSuccessful();

        $this->assertNotNull(AiConversation::find($stale->id));
    }

    public function test_the_retention_window_is_configurable(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        $conversation = $this->conversationFor($owner, $shop, 'Vieille de 40 jours', now()->subDays(40)->toDateTimeString());

        $this->artisan('ai:purge-conversations --days=30')->assertSuccessful();

        $this->assertNull(AiConversation::find($conversation->id));
    }

    // -------------------------------------------------------------------- titrage

    public function test_the_title_comes_from_the_first_message(): void
    {
        $this->assertSame(
            'Fais un devis pour Matthieu Aka',
            AiConversation::titleFrom("Fais un devis pour   Matthieu Aka\n"),
        );
    }

    public function test_a_long_first_message_is_truncated(): void
    {
        $title = AiConversation::titleFrom(str_repeat('produit ', 40));

        $this->assertLessThanOrEqual(61, mb_strlen($title));
        $this->assertStringEndsWith('…', $title);
    }

    public function test_an_empty_message_still_yields_a_readable_title(): void
    {
        $this->assertSame('Nouvelle conversation', AiConversation::titleFrom('   '));
    }
}
