<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Context of the reviewer's business; kept even if the shop is later
            // removed, so the testimonial stays intact.
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('rating'); // 1..5
            $table->text('comment');
            $table->boolean('would_recommend')->default(true);
            // Snapshots taken at submission time, so a public testimonial does not
            // shift if the user later renames themselves or their shop.
            $table->string('author_name');
            $table->string('author_company')->nullable();
            $table->string('status')->default('pending'); // pending | approved | rejected
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            // One review per account; resubmitting updates it and re-enters moderation.
            $table->unique('user_id');
            $table->index(['status', 'approved_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
