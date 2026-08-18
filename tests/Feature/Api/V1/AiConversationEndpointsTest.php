<?php

namespace Tests\Feature\Api\V1;

use App\Models\AiConversation;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Les trois routes HTTP de l'historique, telles que la modale les appelle.
 *
 * Les tests précédents portaient sur le modèle et la commande de purge : ils passaient
 * au vert pendant que les routes, elles, renvoyaient un fil vide.
 */
class AiConversationEndpointsTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop} */
    private function ownerWithShop(): array
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        return [$user, $shop];
    }

    private function conversationFor(User $user, Shop $shop, string $title = 'Devis Matthieu'): AiConversation
    {
        $conversation = AiConversation::create([
            'user_id' => $user->id,
            'shop_id' => $shop->id,
            'title' => $title,
            'last_message_at' => now(),
        ]);

        $conversation->messages()->create(['role' => 'user', 'content' => 'Fais un devis']);
        $conversation->messages()->create(['role' => 'assistant', 'content' => 'Devis QTE-1 créé.']);

        return $conversation;
    }

    public function test_the_list_returns_the_users_conversations(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $this->conversationFor($user, $shop, 'Devis Matthieu');

        $this->actingAs($user)
            ->withSession(['active_shop_id' => $shop->id])
            ->getJson(route('ai.conversations', ['code_user' => $user->code_user]))
            ->assertOk()
            ->assertJsonCount(1, 'conversations')
            ->assertJsonPath('conversations.0.title', 'Devis Matthieu');
    }

    public function test_opening_a_conversation_returns_its_messages(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $conversation = $this->conversationFor($user, $shop);

        $this->actingAs($user)
            ->withSession(['active_shop_id' => $shop->id])
            ->getJson(route('ai.conversation', ['code_user' => $user->code_user, 'conversation' => $conversation->id]))
            ->assertOk()
            ->assertJsonCount(2, 'messages')
            ->assertJsonPath('messages.0.content', 'Fais un devis')
            ->assertJsonPath('messages.1.content', 'Devis QTE-1 créé.');
    }

    public function test_a_colleagues_conversation_is_not_readable(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        $colleague = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);
        $theirs = $this->conversationFor($colleague, $shop, 'Fil du collègue');

        $this->actingAs($owner)
            ->withSession(['active_shop_id' => $shop->id])
            ->getJson(route('ai.conversation', ['code_user' => $owner->code_user, 'conversation' => $theirs->id]))
            ->assertNotFound();
    }

    public function test_a_conversation_can_be_deleted_with_its_messages(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $conversation = $this->conversationFor($user, $shop);

        $this->actingAs($user)
            ->withSession(['active_shop_id' => $shop->id])
            ->deleteJson(route('ai.conversation.destroy', ['code_user' => $user->code_user, 'conversation' => $conversation->id]))
            ->assertOk();

        $this->assertNull(AiConversation::find($conversation->id));
        $this->assertDatabaseMissing('ai_messages', ['ai_conversation_id' => $conversation->id]);
    }

    public function test_a_colleagues_conversation_cannot_be_deleted(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        $colleague = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);
        $theirs = $this->conversationFor($colleague, $shop);

        $this->actingAs($owner)
            ->withSession(['active_shop_id' => $shop->id])
            ->deleteJson(route('ai.conversation.destroy', ['code_user' => $owner->code_user, 'conversation' => $theirs->id]))
            ->assertNotFound();

        $this->assertNotNull(AiConversation::find($theirs->id));
    }
}
