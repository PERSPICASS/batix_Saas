<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Off-site copy of the uploaded files (product and blog images, expense
 * receipts, …). db:backup only covers the database: these files lived on the
 * VPS disk alone, so losing the server lost them for good.
 *
 * Incremental mirror onto the same 'backups' disk as the database dumps, under
 * "<prefix>/files/<public|private>/…": a file is uploaded when it is missing
 * remotely or its size differs. Files deleted locally are deliberately kept
 * off-site — an accidental deletion (or a wiped volume) must stay recoverable.
 */
class BackupFiles extends Command
{
    protected $signature = 'files:backup
        {--disk=backups : Filesystem disk holding the off-site copies.}
        {--dry-run : List what would be uploaded without writing anything.}';

    protected $description = 'Mirror uploaded files (storage/app/public and private) to the off-site backup disk';

    /** Local roots to mirror, keyed by their folder name off-site. */
    protected function roots(): array
    {
        return [
            'public' => storage_path('app/public'),
            'private' => storage_path('app/private'),
        ];
    }

    public function handle(): int
    {
        $disk = $this->option('disk');

        // A failure, not a warning: this command has no other purpose than the
        // off-site copy, so "not configured" must reach the scheduler's onFailure.
        if (blank(config("filesystems.disks.{$disk}.bucket"))) {
            $this->error("No bucket configured on the '{$disk}' disk: uploaded files have NO off-site copy.");
            $this->line('Set BACKUP_S3_BUCKET, BACKUP_S3_KEY, BACKUP_S3_SECRET and BACKUP_S3_ENDPOINT. See docs/DATABASE_BACKUP.md');

            return self::FAILURE;
        }

        $prefix = trim((string) config("filesystems.disks.{$disk}.path_prefix", ''), '/');
        $remoteBase = ltrim(($prefix === '' ? '' : "{$prefix}/").'files', '/');

        $uploaded = $skipped = $bytes = 0;
        $failures = [];

        foreach ($this->roots() as $name => $root) {
            if (! is_dir($root)) {
                continue;
            }

            // One listing per root instead of a size() call per file.
            $remoteSizes = $this->remoteSizes($disk, "{$remoteBase}/{$name}");

            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
            );

            foreach ($files as $file) {
                /** @var \SplFileInfo $file */
                if (! $file->isFile() || $file->getFilename() === '.gitignore') {
                    continue;
                }

                $relative = ltrim(str_replace('\\', '/', substr($file->getPathname(), strlen($root))), '/');
                $remote = "{$remoteBase}/{$name}/{$relative}";
                $size = $file->getSize();

                if (($remoteSizes[$remote] ?? null) === $size) {
                    $skipped++;
                    continue;
                }

                if ($this->option('dry-run')) {
                    $this->line("would upload {$remote} ({$size} bytes)");
                    $uploaded++;
                    $bytes += $size;
                    continue;
                }

                try {
                    $handle = fopen($file->getPathname(), 'rb');
                    if ($handle === false) {
                        throw new \RuntimeException('cannot open for reading');
                    }

                    try {
                        Storage::disk($disk)->writeStream($remote, $handle);
                    } finally {
                        fclose($handle);
                    }

                    $uploaded++;
                    $bytes += $size;
                } catch (\Throwable $e) {
                    // One unreadable file must not stop the rest of the mirror.
                    $failures[] = "{$remote}: {$e->getMessage()}";
                }
            }
        }

        $summary = sprintf(
            '%s %d file(s) (%s), %d already up to date.',
            $this->option('dry-run') ? 'Would upload' : 'Uploaded',
            $uploaded,
            $this->humanBytes($bytes),
            $skipped,
        );
        $this->info($summary);

        if ($failures !== []) {
            foreach ($failures as $failure) {
                $this->error("Upload failed: {$failure}");
            }
            Log::error('files:backup — some uploads failed', ['failures' => $failures]);

            return self::FAILURE;
        }

        if (! $this->option('dry-run')) {
            Log::info('Off-site files backup done', ['uploaded' => $uploaded, 'bytes' => $bytes, 'unchanged' => $skipped]);
        }

        return self::SUCCESS;
    }

    /** @return array<string, int> remote path => size */
    private function remoteSizes(string $disk, string $directory): array
    {
        $sizes = [];

        foreach (Storage::disk($disk)->listContents($directory, true) as $item) {
            if ($item->isFile()) {
                $sizes[$item->path()] = $item->fileSize();
            }
        }

        return $sizes;
    }

    private function humanBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 1).' '.$units[$i];
    }
}
