<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup
        {--keep-days=14 : Delete dumps older than this. 0 disables pruning.}
        {--path= : Directory to write to. Defaults to storage/app/backups.}
        {--disk=backups : Filesystem disk holding the off-site copies.}
        {--no-offsite : Keep the dump local even if an off-site disk is configured.}';

    protected $description = 'Dump the PostgreSQL database, verify the dump is readable, and prune old ones';

    /**
     * Custom format (-Fc) rather than plain SQL: it is compressed on the fly, and
     * `pg_restore --list` can read its table of contents without restoring anything.
     * That is what makes the verification step below possible — a plain .sql.gz can
     * only be checked by decompressing it, which tells us nothing about whether
     * Postgres would actually accept the contents.
     */
    private const DUMP_FORMAT = 'custom';

    public function handle(): int
    {
        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        if (($config['driver'] ?? null) !== 'pgsql') {
            $this->error("db:backup only supports PostgreSQL; the '{$connection}' connection uses '{$config['driver']}'.");

            return self::FAILURE;
        }

        $directory = $this->option('path') ?: storage_path('app/backups');

        // The @ is deliberate: Laravel promotes mkdir()'s warning to an ErrorException,
        // which would bypass the diagnostics below and print a bare stack trace instead.
        // An unwritable directory is the expected symptom of a misconfigured volume,
        // so it deserves an actionable message rather than a trace.
        if (! is_dir($directory) && ! @mkdir($directory, 0750, true) && ! is_dir($directory)) {
            $this->error("Cannot create the backup directory: {$directory}");
            $this->line('Check that storage/ is mounted and writable by the container user.');

            return self::FAILURE;
        }

        if (! is_writable($directory)) {
            $this->error("The backup directory is not writable: {$directory}");

            return self::FAILURE;
        }

        $file = $directory.'/'.$config['database'].'-'.now()->format('Y-m-d_His').'.dump';

        try {
            $this->dump($config, $file);
            $tables = $this->verify($file);
        } catch (\Throwable $e) {
            // Leave the partial file in place: its size is a useful clue when
            // diagnosing (0 bytes = auth/connection, truncated = disk or timeout).
            Log::error('Database backup failed', ['file' => $file, 'error' => $e->getMessage()]);

            $this->error($e->getMessage());

            // Rethrown so Sentry records it. A backup that fails quietly is the
            // same as no backup at all, and this runs unattended every night.
            report($e);

            return self::FAILURE;
        }

        $size = $this->humanSize((int) filesize($file));
        $this->info("Backup written: {$file} ({$size}, {$tables} tables)");
        Log::info('Database backup succeeded', ['file' => $file, 'bytes' => filesize($file), 'tables' => $tables]);

        $offsite = $this->upload($file);

        $this->prune($directory);

        // The local dump is good either way, so the command still succeeds; but a
        // configured off-site target that failed must not be reported as a clean run.
        return $offsite === false ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Copy the dump off the machine it was taken on.
     *
     * Returns null when no off-site target is configured, true on success, false on
     * failure. A local-only backup covers a bad migration or an accidental deletion;
     * it does not cover losing the server, which is the case this exists for.
     */
    private function upload(string $file): ?bool
    {
        if ($this->option('no-offsite')) {
            return null;
        }

        $disk = $this->option('disk');

        if (blank(config("filesystems.disks.{$disk}.bucket"))) {
            // Loud, not silent: "no off-site copy" is a state someone must notice.
            $this->warn("Off-site upload skipped — no bucket configured on the '{$disk}' disk.");
            $this->line('Set BACKUP_S3_BUCKET, BACKUP_S3_KEY, BACKUP_S3_SECRET and BACKUP_S3_ENDPOINT. See docs/DATABASE_BACKUP.md');

            return null;
        }

        $name = basename($file);
        $key = trim((string) config('filesystems.disks.'.$disk.'.path_prefix', ''), '/');
        $remote = $key === '' ? $name : "{$key}/{$name}";

        try {
            // Streamed rather than read into memory: a dump grows with the business,
            // and the scheduler container has no reason to hold it all at once.
            $handle = fopen($file, 'rb');

            if ($handle === false) {
                throw new \RuntimeException("Cannot reopen the dump for upload: {$file}");
            }

            try {
                Storage::disk($disk)->writeStream($remote, $handle);
            } finally {
                fclose($handle);
            }

            // Confirm what actually landed. The 'backups' disk is configured with
            // 'throw' => true so a failed write raises, but a truncated upload can
            // still return normally — compare the sizes rather than trusting silence.
            $remoteSize = Storage::disk($disk)->size($remote);
            $localSize = (int) filesize($file);

            if ($remoteSize !== $localSize) {
                throw new \RuntimeException(
                    "Off-site copy is {$remoteSize} bytes but the local dump is {$localSize}."
                );
            }
        } catch (\Throwable $e) {
            Log::error('Off-site backup upload failed', ['file' => $file, 'error' => $e->getMessage()]);
            $this->error('Off-site upload failed: '.$e->getMessage());
            report($e);

            return false;
        }

        $this->info("Off-site copy uploaded: {$disk}:{$remote}");
        Log::info('Off-site backup uploaded', ['disk' => $disk, 'key' => $remote, 'bytes' => filesize($file)]);

        $this->pruneRemote($disk, $key);

        return true;
    }

    /**
     * Apply the same retention off-site. Without this the bucket grows forever, which
     * is how an object-storage bill quietly becomes the reason backups get turned off.
     */
    private function pruneRemote(string $disk, string $prefix): void
    {
        $keepDays = (int) $this->option('keep-days');

        if ($keepDays <= 0) {
            return;
        }

        $cutoff = now()->subDays($keepDays)->getTimestamp();
        $deleted = 0;

        try {
            foreach (Storage::disk($disk)->files($prefix) as $remote) {
                if (! str_ends_with($remote, '.dump')) {
                    continue;
                }

                if (Storage::disk($disk)->lastModified($remote) < $cutoff) {
                    Storage::disk($disk)->delete($remote);
                    $deleted++;
                }
            }
        } catch (\Throwable $e) {
            // Never fail the run over retention: the fresh copy is already safely
            // uploaded, and an unpruned bucket is a cost problem, not a data one.
            $this->warn('Could not prune old off-site copies: '.$e->getMessage());
            Log::warning('Off-site prune failed', ['error' => $e->getMessage()]);

            return;
        }

        if ($deleted > 0) {
            $this->line("Pruned {$deleted} off-site copy/copies older than {$keepDays} days.");
        }
    }

    private function dump(array $config, string $file): void
    {
        $process = new Process(
            [
                'pg_dump',
                '--host='.$config['host'],
                '--port='.$config['port'],
                '--username='.$config['username'],
                '--dbname='.$config['database'],
                '--format='.self::DUMP_FORMAT,
                '--no-owner',
                '--no-privileges',
                '--file='.$file,
            ],
            // The password goes through the environment, never the argument list:
            // arguments are world-readable in `ps` for the lifetime of the process.
            env: ['PGPASSWORD' => (string) ($config['password'] ?? '')],
            timeout: 1800,
        );

        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException('pg_dump failed: '.trim($process->getErrorOutput()));
        }
    }

    /**
     * Read the dump's table of contents back. This is the difference between having
     * a backup and believing you have one: pg_dump can exit 0 and still leave an
     * unusable file if the disk fills mid-write.
     *
     * @return int number of tables found in the dump
     */
    private function verify(string $file): int
    {
        if (! is_file($file) || filesize($file) === 0) {
            throw new \RuntimeException("pg_dump reported success but produced no data: {$file}");
        }

        $process = new Process(['pg_restore', '--list', $file], timeout: 300);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException('The dump is unreadable by pg_restore: '.trim($process->getErrorOutput()));
        }

        $tables = preg_match_all('/^\d+;.*\bTABLE DATA\b/m', $process->getOutput());

        if ($tables === 0) {
            throw new \RuntimeException("The dump is readable but contains no table data: {$file}");
        }

        return $tables;
    }

    private function prune(string $directory): void
    {
        $keepDays = (int) $this->option('keep-days');

        if ($keepDays <= 0) {
            return;
        }

        $cutoff = now()->subDays($keepDays)->getTimestamp();
        $deleted = 0;

        foreach (glob($directory.'/*.dump') ?: [] as $old) {
            if (filemtime($old) < $cutoff) {
                unlink($old);
                $deleted++;
            }
        }

        if ($deleted > 0) {
            $this->line("Pruned {$deleted} dump(s) older than {$keepDays} days.");
        }
    }

    private function humanSize(int $bytes): string
    {
        foreach (['B', 'KB', 'MB', 'GB'] as $unit) {
            if ($bytes < 1024) {
                return round($bytes, 1).' '.$unit;
            }
            $bytes /= 1024;
        }

        return round($bytes, 1).' TB';
    }
}
