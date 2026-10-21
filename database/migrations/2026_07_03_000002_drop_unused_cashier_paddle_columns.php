<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A previous attempt to wire up Cashier Paddle's Billable trait bolted its columns
     * directly onto the app's own `customers` (CRM shop customers) and `subscriptions`
     * tables, and created an unused `subscription_items` table. The trait was never
     * actually used — App\Models\User::subscriptions() shadows Cashier's own relation,
     * and nothing in the app queries these columns (Paddle checkout/webhook talk to
     * Paddle's REST API directly and use the app's own Subscription/SubscriptionInvoice
     * models). Removing dead schema, not behavior.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // SQLite refuses to drop a column that's still covered by an index.
            $table->dropUnique(['paddle_id']);
            $table->dropColumn(['billable_type', 'billable_id', 'paddle_id', 'trial_ends_at']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropUnique(['paddle_id']);
            $table->dropColumn(['billable_type', 'billable_id', 'paddle_id', 'paused_at']);
        });

        Schema::dropIfExists('subscription_items');
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'billable_type')) {
                $table->string('billable_type')->nullable()->after('id');
            }
            if (!Schema::hasColumn('customers', 'billable_id')) {
                $table->unsignedBigInteger('billable_id')->nullable()->after('billable_type');
            }
            if (!Schema::hasColumn('customers', 'paddle_id')) {
                $table->string('paddle_id')->nullable()->unique()->after('billable_id');
            }
            if (!Schema::hasColumn('customers', 'trial_ends_at')) {
                $table->timestamp('trial_ends_at')->nullable()->after('email');
            }
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'billable_type')) {
                $table->string('billable_type')->nullable()->after('id');
            }
            if (!Schema::hasColumn('subscriptions', 'billable_id')) {
                $table->unsignedBigInteger('billable_id')->nullable()->after('billable_type');
            }
            if (!Schema::hasColumn('subscriptions', 'paddle_id')) {
                $table->string('paddle_id')->nullable()->unique()->after('billable_id');
            }
            if (!Schema::hasColumn('subscriptions', 'paused_at')) {
                $table->timestamp('paused_at')->nullable()->after('status');
            }
        });

        if (!Schema::hasTable('subscription_items')) {
            Schema::create('subscription_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('subscription_id');
                $table->string('product_id');
                $table->string('price_id');
                $table->string('status');
                $table->integer('quantity');
                $table->timestamps();

                $table->unique(['subscription_id', 'price_id']);
            });
        }
    }
};
