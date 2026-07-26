<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Shop extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'address',
        'city',
        'postal_code',
        'country',
        'phone',
        'email',
        'website',
        'logo',
        'tax_id',
        'currency',
        'locale',
        'default_tax_rate',
        'invoice_prefix',
        'invoice_footer',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($shop) {
            if (empty($shop->slug)) {
                $shop->slug = Str::slug($shop->name);
            }
        });
    }

    /**
     * La boutique dont les réglages font référence pour ce compte.
     *
     * Celle de rattachement de l'utilisateur d'abord : plusieurs boutiques peuvent
     * diverger, et celle où il travaille est la réponse qui a du sens. Sinon la dernière
     * créée. Null pour un compte tout neuf, qui n'a rien à hériter.
     */
    public static function settingsSourceFor(User $user): ?self
    {
        if ($user->shop_id && $source = static::find($user->shop_id)) {
            return $source;
        }

        return $user->accessibleShopsQuery()->orderByDesc('id')->first();
    }

    /**
     * La devise qu'une nouvelle boutique doit adopter.
     *
     * `shops.currency` vaut `MAD` par défaut en base : une boutique créée sans devise
     * explicite repartait sur le Maroc, quel que soit le pays du compte et quoi qu'ait
     * réglé son propriétaire. USD n'est le dernier recours que pour un compte tout neuf.
     */
    public static function defaultCurrencyFor(User $user): string
    {
        return static::settingsSourceFor($user)?->currency ?: 'USD';
    }

    /**
     * Les réglages d'entreprise qu'une nouvelle boutique reprend du compte.
     *
     * Ce sont ceux qui relèvent de la société, pas de l'établissement : la devise, le
     * régime de taxe, l'identifiant fiscal, les conventions de facturation. Le formulaire
     * de création n'en demande aucun — ils retombaient donc sur les défauts de la base, ou
     * restaient vides.
     *
     * Ce qui identifie l'établissement — nom, adresse, ville, téléphone — n'est
     * délibérément PAS repris : une succursale a les siens.
     *
     * Le logo non plus, et c'est un choix : les boutiques partageraient alors le même
     * fichier, or SettingsController supprime l'ancien fichier quand on en téléverse un
     * nouveau. La première boutique à changer de logo effacerait celui des autres.
     *
     * @return array<string, mixed> Réglages du compte, à compléter par ce que le
     *                              formulaire a réellement renseigné.
     */
    public static function inheritedSettingsFor(User $user): array
    {
        $source = static::settingsSourceFor($user);

        return [
            'currency' => $source?->currency ?: 'USD',
            'locale' => $source?->locale ?: 'fr',
            'default_tax_rate' => $source?->default_tax_rate,
            'tax_id' => $source?->tax_id,
            'invoice_prefix' => $source?->invoice_prefix,
            'invoice_footer' => $source?->invoice_footer,
            'website' => $source?->website,
        ];
    }

    /**
     * La langue des documents que cette boutique émet — mails et PDF.
     *
     * Distincte de `users.locale`, qui ne gouverne que l'interface : ce qu'un client reçoit
     * ne doit pas dépendre de la langue dans laquelle son fournisseur navigue.
     */
    public function documentLocale(): string
    {
        return $this->locale ?: 'fr';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
