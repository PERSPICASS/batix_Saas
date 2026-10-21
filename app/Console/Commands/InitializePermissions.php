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
        $users = User::whereNotIn('role', ['super_admin', 'admin_platforme'])->get();

        foreach ($users as $user) {
            foreach (UserPermission::defaultsForRole($user->role) as $module => $actions) {
                UserPermission::updateOrCreate(
                    ['user_id' => $user->id, 'module' => $module],
                    $actions
                );
            }

            $this->line("✓ Permissions initialized for {$user->name} ({$user->role})");
        }

        $this->info('All permissions have been initialized!');
    }
}
