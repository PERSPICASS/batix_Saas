<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Un fil de discussion avec l'assistant IA, pour un utilisateur et une boutique.
 */
class AiConversation extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'shop_id', 'title', 'last_message_at'];

    protected $casts = ['last_message_at' => 'datetime'];

    /** Longueur du titre déduit du premier message. */
    private const TITLE_LENGTH = 60;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AiMessage::class);
    }

    /**
     * Restreint aux conversations de CET utilisateur dans CETTE boutique.
     *
     * Le couple est la frontière, et il est volontairement plus strict que le simple
     * cloisonnement par boutique : un employé et son responsable travaillent sur la même
     * boutique sans avoir à relire leurs échanges respectifs. Toute requête partant d'une
     * saisie utilisateur (identifiant de conversation) doit passer par ce scope — un
     * contrôle de rôle n'y suffirait pas, `super_admin` étant attribué à chaque
     * inscription.
     */
    public function scopeOwnedBy(Builder $query, int $userId, int $shopId): Builder
    {
        return $query->where('user_id', $userId)->where('shop_id', $shopId);
    }

    /**
     * Titre lisible déduit du premier message de l'utilisateur.
     *
     * Pas de génération par le modèle : elle coûterait un appel d'API par conversation,
     * pour un libellé que l'utilisateur reconnaît de toute façon à ses propres mots.
     */
    public static function titleFrom(string $firstMessage): string
    {
        $clean = trim(preg_replace('/\s+/', ' ', $firstMessage) ?? '');

        if ($clean === '') {
            return 'Nouvelle conversation';
        }

        return mb_strimwidth($clean, 0, self::TITLE_LENGTH, '…');
    }
}
