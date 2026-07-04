<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Postgres compiles enum columns as `varchar(255) check (...)` (see
     * PostgresGrammar::typeEnum), and Laravel's compileChange() embeds that whole
     * type string verbatim into `alter column ... type ...` — which Postgres rejects,
     * since a CHECK clause can't be attached inline to a TYPE change. The check
     * constraint has to be dropped and re-added as separate statements instead.
     */
    private function statusCheckConstraints(): array
    {
        return array_map(
            fn ($row) => $row->conname,
            DB::select("
                select con.conname
                from pg_constraint con
                join pg_class rel on rel.oid = con.conrelid
                join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
                where rel.relname = 'subscriptions'
                  and att.attname = 'status'
                  and con.contype = 'c'
            ")
        );
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->timestamp('started_at')->nullable()->change();
            });
            return;
        }

        if ($driver === 'pgsql') {
            foreach ($this->statusCheckConstraints() as $conname) {
                DB::statement("alter table subscriptions drop constraint \"{$conname}\"");
            }

            DB::statement("alter table subscriptions add constraint subscriptions_status_check check (status in ('active', 'cancelled', 'expired', 'trial', 'pending'))");
            DB::statement('alter table subscriptions alter column started_at drop not null');
            return;
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->enum('status', ['active', 'cancelled', 'expired', 'trial', 'pending'])->default('active')->change();
            $table->timestamp('started_at')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->timestamp('started_at')->nullable(false)->change();
            });
            return;
        }

        if ($driver === 'pgsql') {
            foreach ($this->statusCheckConstraints() as $conname) {
                DB::statement("alter table subscriptions drop constraint \"{$conname}\"");
            }

            DB::statement("alter table subscriptions add constraint subscriptions_status_check check (status in ('active', 'cancelled', 'expired', 'trial'))");
            DB::statement('alter table subscriptions alter column started_at set not null');
            return;
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->enum('status', ['active', 'cancelled', 'expired', 'trial'])->default('active')->change();
            $table->timestamp('started_at')->nullable(false)->change();
        });
    }
};
