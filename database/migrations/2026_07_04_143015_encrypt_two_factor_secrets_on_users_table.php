<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        // `recovery_codes` was a `json` column — MySQL/SQLite accept a plain
        // Schema::change() here, but Postgres has no implicit cast from json to text
        // and rejects `alter column ... type text` without an explicit `using` clause.
        if ($driver === 'pgsql') {
            DB::statement('alter table users alter column recovery_codes type text using recovery_codes::text');
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->text('recovery_codes')->nullable()->change();
            });
        }

        DB::table('users')
            ->where(function ($q) {
                $q->whereNotNull('google2fa_secret')->orWhereNotNull('recovery_codes');
            })
            ->orderBy('id')
            ->select('id', 'google2fa_secret', 'recovery_codes')
            ->each(function ($user) {
                DB::table('users')->where('id', $user->id)->update([
                    'google2fa_secret' => $user->google2fa_secret !== null
                        ? Crypt::encryptString($user->google2fa_secret)
                        : null,
                    'recovery_codes' => $user->recovery_codes !== null
                        ? Crypt::encryptString($user->recovery_codes)
                        : null,
                ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')
            ->where(function ($q) {
                $q->whereNotNull('google2fa_secret')->orWhereNotNull('recovery_codes');
            })
            ->orderBy('id')
            ->select('id', 'google2fa_secret', 'recovery_codes')
            ->each(function ($user) {
                DB::table('users')->where('id', $user->id)->update([
                    'google2fa_secret' => $user->google2fa_secret !== null
                        ? Crypt::decryptString($user->google2fa_secret)
                        : null,
                    'recovery_codes' => $user->recovery_codes !== null
                        ? Crypt::decryptString($user->recovery_codes)
                        : null,
                ]);
            });

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('alter table users alter column recovery_codes type json using recovery_codes::json');
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->json('recovery_codes')->nullable()->change();
            });
        }
    }
};
