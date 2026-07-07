<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Console\Command;

class AuditPermissions extends Command
{
    protected $signature = 'permissions:audit {--fix : Create missing permission rows using role defaults. Never touches existing rows, so manual customizations are preserved.}';

    protected $description = 'Report users whose permission rows are missing modules their role should have by default (drift from defaultsForRole)';

    public function handle(): int
    {
        $users = User::whereNotIn('role', ['super_admin', 'admin_platforme'])->get();

        if ($users->isEmpty()) {
            $this->info('No non-admin users found.');
            return self::SUCCESS;
        }

        $fix = (bool) $this->option('fix');
        $driftFound = false;

        foreach ($users as $user) {
            $expectedModules = array_keys(UserPermission::defaultsForRole($user->role));
            $actualModules = $user->permissions()->pluck('module')->all();
            $missing = array_diff($expectedModules, $actualModules);

            if (empty($missing)) {
                continue;
            }

            $driftFound = true;
            $this->warn("User #{$user->id} ({$user->email}, role={$user->role}) is missing: " . implode(', ', $missing));

            if ($fix) {
                $defaults = UserPermission::defaultsForRole($user->role);
                foreach ($missing as $module) {
                    UserPermission::create(['user_id' => $user->id, 'module' => $module] + $defaults[$module]);
                }
                $this->line("  -> created {$this->pluralize(count($missing))} for user #{$user->id}");
            }
        }

        if (!$driftFound) {
            $this->info('No drift found — every non-admin user has a row for every module their role expects.');
            return self::SUCCESS;
        }

        if (!$fix) {
            $this->line('');
            $this->line('Run with --fix to create the missing rows (existing rows are never modified, so manual customizations are safe).');
        }

        return self::SUCCESS;
    }

    private function pluralize(int $count): string
    {
        return $count === 1 ? '1 missing row' : "{$count} missing rows";
    }
}
