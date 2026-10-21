<?php

namespace Tests\Feature\Review;

use App\Models\Review;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    private function client(): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        Shop::factory()->create(['user_id' => $user->id, 'name' => 'Quincaillerie Diallo']);

        return $user;
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'rating' => 5,
            'comment' => 'Excellent outil, il a transformé la gestion de ma boutique.',
            'would_recommend' => true,
        ], $overrides);
    }

    public function test_a_logged_in_user_can_submit_a_review_which_starts_pending(): void
    {
        $user = $this->client();

        $this->actingAs($user)
            ->post("/{$user->code_user}/avis", $this->payload())
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'rating' => 5,
            'status' => Review::STATUS_PENDING,
            'author_name' => $user->name,
            'author_company' => 'Quincaillerie Diallo',
        ]);
    }

    public function test_resubmitting_updates_the_same_review_and_returns_to_pending(): void
    {
        $user = $this->client();
        $this->actingAs($user)->post("/{$user->code_user}/avis", $this->payload(['rating' => 5]));

        // Approve it, then the user edits — it must re-enter moderation.
        Review::where('user_id', $user->id)->update(['status' => Review::STATUS_APPROVED]);

        $this->actingAs($user)->post("/{$user->code_user}/avis", $this->payload(['rating' => 3]));

        $this->assertSame(1, Review::where('user_id', $user->id)->count());
        $review = Review::where('user_id', $user->id)->first();
        $this->assertSame(3, $review->rating);
        $this->assertSame(Review::STATUS_PENDING, $review->status);
    }

    public function test_only_approved_reviews_appear_on_the_public_home(): void
    {
        $user = $this->client();
        Review::create([
            'user_id' => $user->id,
            'rating' => 5,
            'comment' => 'Un avis en attente de validation.',
            'would_recommend' => true,
            'author_name' => 'En attente',
            'status' => Review::STATUS_PENDING,
        ]);

        $this->get('/')->assertInertia(fn ($page) => $page->has('reviews', 0));

        Review::where('user_id', $user->id)->update([
            'status' => Review::STATUS_APPROVED,
            'approved_at' => now(),
        ]);

        $this->get('/')->assertInertia(fn ($page) => $page->has('reviews', 1));
    }

    public function test_platform_admin_can_approve_a_review(): void
    {
        $admin = User::factory()->create(['role' => 'admin_platforme']);
        $author = $this->client();
        $review = Review::create([
            'user_id' => $author->id,
            'rating' => 4,
            'comment' => 'Très bon dans l’ensemble.',
            'would_recommend' => true,
            'author_name' => $author->name,
            'status' => Review::STATUS_PENDING,
        ]);

        $this->actingAs($admin)
            ->post(route('platform.reviews.approve', $review))
            ->assertSessionHasNoErrors();

        $review->refresh();
        $this->assertSame(Review::STATUS_APPROVED, $review->status);
        $this->assertNotNull($review->approved_at);
    }

    public function test_a_non_admin_cannot_moderate_reviews(): void
    {
        $author = $this->client();
        $review = Review::create([
            'user_id' => $author->id,
            'rating' => 4,
            'comment' => 'Un avis quelconque à modérer.',
            'would_recommend' => true,
            'author_name' => $author->name,
            'status' => Review::STATUS_PENDING,
        ]);

        // A regular super_admin (not a platform admin) must be blocked.
        $this->actingAs($author)
            ->post(route('platform.reviews.approve', $review))
            ->assertForbidden();

        $this->assertSame(Review::STATUS_PENDING, $review->fresh()->status);
    }
}
