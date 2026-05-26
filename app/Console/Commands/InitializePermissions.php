<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Console\Command;

class InitializePermissions extends Command
{
    protected $signature = 'permissions:initialize';

    protected $description = 'Initialize default permissions for all users based on their role';

    public function handle()
    {
        $defaultPermissions = $this->getDefaultPermissions();

        $users = User::whereNotIn('role', ['super_admin', 'admin_platforme'])->get();

        foreach ($users as $user) {
            $perms = $defaultPermissions[$user->role] ?? [];

            foreach ($perms as $module => $actions) {
                UserPermission::updateOrCreate(
                    ['user_id' => $user->id, 'module' => $module],
                    $actions
                );
            }

            $this->line("✓ Permissions initialized for {$user->name} ({$user->role})");
        }

        $this->info('All permissions have been initialized!');
    }

    private function getDefaultPermissions(): array
    {
        return [
            'manager' => [
                'products' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'customers' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'sales' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 0, 'can_delete' => 1],
                'sales_delete' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 1],
                'sales_restore' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 0],
                'credits' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 1, 'can_delete' => 0],
                'invoices' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'stocks' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'inventory' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'users' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'shops' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 0],
                'categories' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'suppliers' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'purchases' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'depots' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'expenses' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 1],
                'analytics' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 0],
                'activity_logs' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 0],
                'settings' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 1, 'can_delete' => 0],
            ],
            'cashier' => [
                'sales' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 0, 'can_delete' => 0],
                'credits' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 0],
                'customers' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 0],
                'products' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 0],
            ],
            'caisse' => [
                'sales' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 0, 'can_delete' => 0],
                'credits' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 0],
                'customers' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 0],
                'products' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 0],
            ],
            'employee' => [
                'sales' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 0, 'can_delete' => 0],
                'customers' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 0],
                'products' => ['can_view' => 1, 'can_create' => 0, 'can_edit' => 0, 'can_delete' => 0],
                'stocks' => ['can_view' => 1, 'can_create' => 1, 'can_edit' => 1, 'can_delete' => 0],
            ],
        ];
    }
}
