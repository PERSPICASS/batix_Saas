<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Shop;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RepairInvitedOwners extends Command
{
    protected $signature = 'users:repair-invited-owners {--fix : Convert the repairable accounts to admin (co-manager) of their inviter\'s account.}';

    protected $description = 'Find users created as super_admin from the Users screen, who became shopless account owners instead of members of the inviter\'s account';

    /**
     * Le formulaire Utilisateurs proposait « Super Admin ». Or `super_admin` EST le
     * propriétaire de compte : l'invité devenait un nouveau compte sans boutique ni
     * abonnement, et atterrissait sur « créez votre boutique ». La ligne `create` du
     * journal d'activité dit qui l'a créé et depuis quelle boutique : c'est le compte
     * auquel il devait appartenir.
     */
    public function handle(): int
    {
        $ghosts = User::where('role', 'super_admin')
            ->whereDoesntHave('shops')
            ->orderBy('id')
            ->get();

        $repairable = [];
        $manual = [];

        foreach ($ghosts as $ghost) {
            $log = ActivityLog::withoutGlobalScopes()
                ->where('action', 'create')
                ->where('subject_type', User::class)
                ->where('subject_id', $ghost->id)
                ->whereNotNull('user_id')
                ->where('user_id', '!=', $ghost->id)
                ->whereNotNull('shop_id')
                ->oldest()
                ->first();

            $shop = $log ? Shop::find($log->shop_id) : null;
            $hasSubscription = $ghost->subscriptions()->exists();

            $row = [
                'user' => $ghost,
                'inviter' => $log?->user_email ?? '—',
                'shop' => $shop,
                'subscription' => $hasSubscription,
            ];

            // Un abonnement à son nom, ou aucune trace fiable de l'invitant : décision humaine.
            if ($hasSubscription || !$shop) {
                $manual[] = $row;
            } else {
                $repairable[] = $row;
            }
        }

        $this->reportAdmins();

        if ($ghosts->isEmpty()) {
            $this->info('No shopless super_admin — nothing to repair.');
            return self::SUCCESS;
        }

        $table = fn (array $rows) => $this->table(
            ['ID', 'Email', 'Invited by', 'Shop', 'Subscription', 'Created'],
            array_map(fn ($r) => [
                $r['user']->id,
                $r['user']->email,
                $r['inviter'],
                $r['shop'] ? "#{$r['shop']->id} {$r['shop']->name}" : '—',
                $r['subscription'] ? 'yes' : 'no',
                (string) $r['user']->created_at,
            ], $rows)
        );

        if ($repairable) {
            $this->warn(count($repairable) . ' account(s) created as super_admin by another user — repairable:');
            $table($repairable);
        }

        if ($manual) {
            $this->newLine();
            $this->warn(count($manual) . ' shopless super_admin(s) to review by hand (own subscription, or no trace of who created them — possibly a real signup that never created its shop):');
            $table($manual);
        }

        if (!$repairable) {
            return self::SUCCESS;
        }

        if (!$this->option('fix')) {
            $this->newLine();
            $this->line('Run with --fix to turn the repairable ones into admins (co-managers) of the listed shop\'s account.');
            return self::SUCCESS;
        }

        if (!$this->confirm('Convert these ' . count($repairable) . ' account(s) to admin of the listed shop?', false)) {
            $this->info('Aborted — nothing was changed.');
            return self::SUCCESS;
        }

        foreach ($repairable as $r) {
            DB::transaction(function () use ($r) {
                $user = $r['user'];
                $user->update(['role' => 'admin', 'shop_id' => $r['shop']->id]);
                $user->permissions()->delete();
                foreach (UserPermission::defaultsForRole('admin') as $module => $actions) {
                    UserPermission::create(['user_id' => $user->id, 'module' => $module] + $actions);
                }
            });
            $this->line("  #{$r['user']->id} ({$r['user']->email}) → admin of shop #{$r['shop']->id}");
        }

        $this->newLine();
        $this->info('Repaired ' . count($repairable) . ' account(s).');

        return self::SUCCESS;
    }

    /**
     * Le rôle `admin` voyait une seule boutique ; il voit désormais toutes celles du
     * compte. Ceux qui l'ont déjà sont listés pour que ce changement ne surprenne personne.
     */
    private function reportAdmins(): void
    {
        $admins = User::where('role', 'admin')->with('shop')->orderBy('id')->get();

        if ($admins->isEmpty()) {
            return;
        }

        $this->info("{$admins->count()} existing admin(s) — they now see EVERY shop of their account, not just their own:");
        $this->table(
            ['ID', 'Email', 'Main shop', 'Account shops'],
            $admins->map(fn (User $u) => [
                $u->id,
                $u->email,
                $u->shop ? "#{$u->shop->id} {$u->shop->name}" : '—',
                $u->shop ? Shop::where('user_id', $u->shop->user_id)->count() : 0,
            ])->all()
        );
        $this->newLine();
    }
}
