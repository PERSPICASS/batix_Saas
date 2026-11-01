<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Rôle « Chargé de facturation » : la contrainte `users_role_check` refuserait la valeur.
 */
return new class extends Migration
{
    private const WITH = "'super_admin', 'admin_platforme', 'admin', 'manager', 'stock_manager', 'billing_clerk', 'cashier', 'staff', 'caisse', 'employee'";
    private const WITHOUT = "'super_admin', 'admin_platforme', 'admin', 'manager', 'stock_manager', 'cashier', 'staff', 'caisse', 'employee'";

    public function up(): void
    {
        $this->setRoles(self::WITH);
    }

    public function down(): void
    {
        DB::table('users')->where('role', 'billing_clerk')->update(['role' => 'staff']);
        $this->setRoles(self::WITHOUT);
    }

    private function setRoles(string $roles): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ({$roles}))");
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE users DROP CHECK IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ({$roles}))");
        }
        // SQLite : pas de contrainte sur le rôle (colonne TEXT).
    }
};
