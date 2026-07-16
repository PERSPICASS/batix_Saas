<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class AuditOrphanUsers extends Command
{
    protected $signature = 'users:audit-orphans {--delete : Delete the orphaned accounts. Irreversible.}';

    protected $description = 'Report staff accounts with no shop, which belong to no account and are unreachable from the UI';

    /**
     * Roles that legitimately have no `shop_id`: `super_admin` owns shops through
     * `shops()` rather than belonging to one, and `admin_platforme` has none at all.
     */
    private const SHOPLESS_BY_DESIGN = ['super_admin', 'admin_platforme'];

    public function handle(): int
    {
        $orphans = User::whereNull('shop_id')
            ->whereNotIn('role', self::SHOPLESS_BY_DESIGN)
            ->orderBy('id')
            ->get();

        if ($orphans->isEmpty()) {
            $this->info('No orphaned users — every staff account belongs to a shop.');
            return self::SUCCESS;
        }

        $this->warn("{$orphans->count()} orphaned staff account(s) found:");
        $this->newLine();

        $this->table(
            ['ID', 'Email', 'Role', 'Active', 'Created'],
            $orphans->map(fn (User $u) => [
                $u->id,
                $u->email,
                $u->role,
                $u->is_active ? 'yes' : 'no',
                (string) $u->created_at,
            ])->all()
        );

        $this->newLine();
        $this->line('These have no shop, so they belong to no account: they escape the plan');
        $this->line('user quota, never appear in the users list, and cannot be edited or');
        $this->line('deleted through the UI (those guards require the target\'s shop to be');
        $this->line('one of yours). They can still sign in, though they reach no data.');

        if (!$this->option('delete')) {
            $this->newLine();
            $this->line('Run with --delete to remove them.');
            return self::SUCCESS;
        }

        if (!$this->confirm("Delete these {$orphans->count()} account(s)? This cannot be undone.", false)) {
            $this->info('Aborted — nothing was deleted.');
            return self::SUCCESS;
        }

        foreach ($orphans as $orphan) {
            $orphan->permissions()->delete();
            $orphan->delete();
            $this->line("  deleted #{$orphan->id} ({$orphan->email})");
        }

        $this->newLine();
        $this->info("Deleted {$orphans->count()} orphaned account(s).");

        return self::SUCCESS;
    }
}
