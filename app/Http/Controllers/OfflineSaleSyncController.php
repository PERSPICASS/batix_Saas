<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\ActivityLogger;
use App\Services\SaleCreationService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Rejeu des ventes saisies hors ligne.
 *
 * Authentifié par la session web et non par un jeton d'API : un jeton stocké sur le
 * téléphone d'une boutique serait un secret permanent, exfiltrable par n'importe quelle
 * faille XSS. Conséquence assumée — la session expire au bout de SESSION_LIFETIME
 * (2 h) : un vendeur resté hors ligne plus longtemps devra se reconnecter. Rien n'est
 * perdu pour autant, la file du client ne supprime une vente qu'une fois confirmée.
 *
 * Chaque vente est traitée indépendamment : une vente refusée pour stock insuffisant ne
 * doit pas bloquer les suivantes, sinon une seule rupture de stock ferait échouer toute
 * la journée d'un vendeur.
 */
class OfflineSaleSyncController extends Controller
{
    /** Garde-fou : au-delà, la requête est trop lourde pour un réseau instable. */
    private const MAX_BATCH = 50;

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sales'                     => 'required|array|min:1|max:'.self::MAX_BATCH,
            'sales.*.client_uuid'       => 'required|uuid',
            'sales.*.shop_id'           => 'required|exists:shops,id',
            'sales.*.customer_id'       => 'nullable|exists:customers,id',
            'sales.*.payment_method'    => 'required|in:cash,card,transfer,check,mobile,multiple,credit',
            'sales.*.amount_paid'       => 'required|numeric|min:0',
            'sales.*.discount_amount'   => 'nullable|numeric|min:0',
            'sales.*.sale_date'         => 'required|date',
            'sales.*.notes'             => 'nullable|string',
            'sales.*.items'             => 'required|array|min:1',
            'sales.*.items.*.product_id' => 'required|exists:products,id',
            'sales.*.items.*.quantity'  => 'required|integer|min:1',
            'sales.*.items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        $results = [];

        foreach ($validated['sales'] as $payload) {
            $results[] = $this->syncOne($user, $payload);
        }

        return response()->json(['results' => $results]);
    }

    /**
     * @return array{client_uuid: string, status: string, ticket_number?: string, message?: string}
     */
    private function syncOne($user, array $payload): array
    {
        $uuid = $payload['client_uuid'];

        // Rejeu le plus courant : la vente était déjà passée, seule la réponse s'est
        // perdue. On répond comme si l'envoi venait de réussir, le client peut purger.
        $existing = Sale::where('client_uuid', $uuid)->first();
        if ($existing) {
            return $this->done($uuid, $existing);
        }

        $shop = $user->accessibleShopsQuery()->find($payload['shop_id']);

        if (!$shop) {
            // Refus définitif : inutile de laisser le client réessayer indéfiniment.
            return [
                'client_uuid' => $uuid,
                'status'      => 'rejected',
                'message'     => "Cette vente ne correspond à aucune de vos boutiques.",
            ];
        }

        $data = $payload;
        unset($data['client_uuid']);
        $data['client_uuid'] = $uuid;
        $data['user_id'] = $user->id;

        try {
            $sale = SaleCreationService::create($data, $shop);
        } catch (ValidationException $e) {
            // Cas typique du hors-ligne : deux vendeurs ont vendu le même dernier article
            // chacun de leur côté. Le stock fait foi côté serveur ; on renvoie la raison
            // pour que le gérant tranche, plutôt que de créer une vente en stock négatif.
            return [
                'client_uuid' => $uuid,
                'status'      => 'rejected',
                'message'     => collect($e->errors())->flatten()->first() ?? $e->getMessage(),
            ];
        } catch (QueryException $e) {
            // Deux synchronisations concurrentes du même appareil : l'index unique a
            // tranché. On relit la vente gagnante au lieu de remonter une erreur.
            $winner = Sale::where('client_uuid', $uuid)->first();

            if ($winner) {
                return $this->done($uuid, $winner);
            }

            Log::error('Offline sale sync failed', ['client_uuid' => $uuid, 'error' => $e->getMessage()]);

            return [
                'client_uuid' => $uuid,
                'status'      => 'failed',
                'message'     => "Enregistrement impossible pour le moment.",
            ];
        }

        ActivityLogger::created($sale, $sale->ticket_number);

        return $this->done($uuid, $sale);
    }

    private function done(string $uuid, Sale $sale): array
    {
        return [
            'client_uuid'   => $uuid,
            'status'        => 'synced',
            'sale_id'       => $sale->id,
            'ticket_number' => $sale->ticket_number,
        ];
    }
}
