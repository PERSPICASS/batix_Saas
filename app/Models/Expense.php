<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Expense extends Model
{
    use HasFactory;

    /**
     * Le disque des justificatifs, hors du dossier servi par le serveur web.
     *
     * Un justificatif est une facture fournisseur ou un ticket de carte : montants, noms,
     * parfois coordonnées bancaires. Il a longtemps vécu sur le disque `public`, donc lisible
     * par quiconque connaissait l'URL, sans session. Le nom de fichier aléatoire n'était pas
     * une protection, seulement un délai.
     *
     * À ne pas confondre avec le reçu client envoyé par WhatsApp : celui-là est une page
     * rendue derrière un lien signé temporaire (voir App\Services\DocumentLink), et n'a
     * jamais transité par ce disque.
     */
    public const RECEIPT_DISK = 'local';

    protected $fillable = [
        'shop_id',
        'user_id',
        'title',
        'amount',
        'category',
        'expense_date',
        'payment_method',
        'reference',
        'notes',
        'receipt',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Le disque où le justificatif se trouve réellement, ou null s'il n'y en a pas.
     *
     * Le repli sur `public` couvre la fenêtre entre le déploiement et le passage de
     * `expenses:secure-receipts` : tant que les fichiers déjà en place n'ont pas été
     * déplacés, les liens de l'application doivent continuer d'ouvrir quelque chose.
     * Une fois la commande passée, cette branche ne sert plus — c'est voulu.
     */
    public function receiptDisk(): ?string
    {
        if (!$this->receipt) {
            return null;
        }

        foreach ([self::RECEIPT_DISK, 'public'] as $disk) {
            if (Storage::disk($disk)->exists($this->receipt)) {
                return $disk;
            }
        }

        return null;
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
