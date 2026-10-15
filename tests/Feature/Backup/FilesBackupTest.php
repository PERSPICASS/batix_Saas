<?php

namespace Tests\Feature\Backup;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * db:backup ne sauvegardait que la base : images produits, blog et
 * justificatifs de dépenses n'existaient que sur le disque du VPS.
 */
class FilesBackupTest extends TestCase
{
    private string $publicRoot;
    private string $privateRoot;

    protected function setUp(): void
    {
        parent::setUp();

        // Racines jetables : le test ne touche jamais au vrai storage/app.
        $base = sys_get_temp_dir().'/batix-files-backup-'.uniqid();
        $this->publicRoot = "{$base}/public";
        $this->privateRoot = "{$base}/private";
        File::ensureDirectoryExists($this->publicRoot.'/products');
        File::ensureDirectoryExists($this->privateRoot.'/receipts');

        config(['filesystems.disks.backups.bucket' => 'test-bucket', 'filesystems.disks.backups.path_prefix' => 'prod']);
        Storage::fake('backups');
    }

    public function test_it_fails_loudly_without_a_bucket(): void
    {
        config(['filesystems.disks.backups.bucket' => null]);

        $this->artisan('files:backup')
            ->expectsOutputToContain('NO off-site copy')
            ->assertFailed();
    }

    public function test_it_mirrors_new_files_then_skips_unchanged_ones(): void
    {
        $this->useRoots();
        File::put($this->publicRoot.'/products/drill.jpg', 'image-bytes');
        File::put($this->privateRoot.'/receipts/r1.pdf', 'pdf-bytes');

        $this->artisan('files:backup')->expectsOutputToContain('Uploaded 2 file(s)')->assertSuccessful();

        Storage::disk('backups')->assertExists('prod/files/public/products/drill.jpg');
        Storage::disk('backups')->assertExists('prod/files/private/receipts/r1.pdf');
        $this->assertSame('pdf-bytes', Storage::disk('backups')->get('prod/files/private/receipts/r1.pdf'));

        // Second run: nothing changed, nothing re-sent.
        $this->artisan('files:backup')->expectsOutputToContain('Uploaded 0 file(s)')->assertSuccessful();

        // A modified file goes again.
        File::put($this->publicRoot.'/products/drill.jpg', 'a-bigger-image-now');
        $this->artisan('files:backup')->expectsOutputToContain('Uploaded 1 file(s)')->assertSuccessful();
        $this->assertSame('a-bigger-image-now', Storage::disk('backups')->get('prod/files/public/products/drill.jpg'));
    }

    public function test_a_file_deleted_locally_is_kept_off_site(): void
    {
        $this->useRoots();
        File::put($this->publicRoot.'/products/old.jpg', 'x');
        $this->artisan('files:backup')->assertSuccessful();

        File::delete($this->publicRoot.'/products/old.jpg');
        $this->artisan('files:backup')->assertSuccessful();

        Storage::disk('backups')->assertExists('prod/files/public/products/old.jpg');
    }

    public function test_dry_run_writes_nothing(): void
    {
        $this->useRoots();
        File::put($this->publicRoot.'/products/a.jpg', 'x');

        $this->artisan('files:backup', ['--dry-run' => true])
            ->expectsOutputToContain('Would upload 1 file(s)')
            ->assertSuccessful();

        Storage::disk('backups')->assertMissing('prod/files/public/products/a.jpg');
    }

    private function useRoots(): void
    {
        $this->app->bind(\App\Console\Commands\BackupFiles::class, fn () => new class($this->publicRoot, $this->privateRoot) extends \App\Console\Commands\BackupFiles {
            public function __construct(private string $pub, private string $priv)
            {
                parent::__construct();
            }

            protected function roots(): array
            {
                return ['public' => $this->pub, 'private' => $this->priv];
            }
        });
    }
}
