<?php

namespace App\Http\Controllers;

use App\Models\AiConversation;
use App\Services\AiChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiChatController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:2000',
                'conversation_id' => 'nullable|integer',
            ]);

            $user = Auth::user();
            $shop = current_shop();

            if (!$shop) {
                return response()->json([
                    'error' => 'Aucune boutique sélectionnée',
                ], 400);
            }

            // Check if user has access to AI Assistant
            $subscription = $user->activeSubscription();
            if (!$subscription || !$subscription->hasAiAssistant()) {
                return response()->json([
                    'error' => 'L\'assistant IA est disponible uniquement sur les plans Growth, Pro et Entreprise. Mettez à niveau votre abonnement pour y accéder.',
                ], 403);
            }

            $shopIds = [$shop->id];

            // La conversation est résolue AVANT l'appel au modèle : c'est elle qui porte
            // l'historique, désormais lu en base plutôt que renvoyé par le navigateur.
            // Un client ne dicte plus ce que l'assistant croit avoir dit.
            $conversation = $this->resolveConversation($validated['conversation_id'] ?? null, $user, $shop, $validated['message']);

            $history = $conversation->messages()
                ->orderByDesc('id')
                ->limit(20)
                ->get(['role', 'content'])
                ->reverse()
                ->values()
                ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
                ->all();

            $conversation->messages()->create(['role' => 'user', 'content' => $validated['message']]);

            $reply = AiChatService::chat(
                $validated['message'],
                $history,
                $shopIds,
                $user,
                $shop->name,
            );

            $conversation->messages()->create(['role' => 'assistant', 'content' => $reply]);
            $conversation->forceFill(['last_message_at' => now()])->save();

            return response()->json([
                'reply' => $reply,
                'conversation_id' => $conversation->id,
                'title' => $conversation->title,
            ]);
        } catch (\Anthropic\Core\Exceptions\BadRequestException $e) {
            \Log::error('AI Chat - Bad Request: ' . $e->getMessage());

            // Parse error message from Anthropic API
            $errorMsg = $this->parseAnthropicError($e->getMessage());

            return response()->json([
                'error' => $errorMsg,
            ], 400);
        } catch (\Anthropic\Core\Exceptions\AuthenticationException $e) {
            \Log::error('AI Chat - Authentication Error: ' . $e->getMessage());

            return response()->json([
                'error' => 'Erreur d\'authentification avec le service IA. Veuillez contacter le support.',
            ], 401);
        } catch (\App\Services\Mcp\McpUnavailableException $e) {
            \Log::error('AI Chat - MCP unavailable: ' . $e->getMessage());

            return response()->json([
                'error' => 'Le service de données de l\'assistant est momentanément indisponible. Veuillez réessayer dans un instant.',
            ], 503);
        } catch (\Exception $e) {
            \Log::error('AI Chat error: ' . $e->getMessage(), [
                'exception' => $e,
                'class' => get_class($e),
            ]);

            return response()->json([
                'error' => 'Une erreur est survenue lors du traitement de votre requête. Veuillez réessayer.',
            ], 500);
        }
    }

    /**
     * Retrouve la conversation visée, ou en ouvre une nouvelle.
     *
     * L'identifiant vient du navigateur : il passe donc par le scope propriétaire, qui
     * borne à l'utilisateur ET à la boutique. Sans cela, remplacer un chiffre dans la
     * requête suffirait à poursuivre — et à lire — le fil d'un collègue. Un identifiant
     * inconnu ne provoque pas d'erreur : on ouvre simplement un nouveau fil, ce qui évite
     * de bloquer un onglet resté ouvert sur une conversation depuis purgée.
     */
    private function resolveConversation(?int $conversationId, $user, $shop, string $firstMessage): AiConversation
    {
        if ($conversationId !== null) {
            $existing = AiConversation::ownedBy($user->id, $shop->id)->find($conversationId);

            if ($existing) {
                return $existing;
            }
        }

        return AiConversation::create([
            'user_id' => $user->id,
            'shop_id' => $shop->id,
            'title' => AiConversation::titleFrom($firstMessage),
            'last_message_at' => now(),
        ]);
    }

    /** Conversations de l'utilisateur dans la boutique courante, la plus récente d'abord. */
    public function conversations(Request $request): JsonResponse
    {
        $shop = current_shop();

        if (! $shop) {
            return response()->json(['conversations' => []]);
        }

        $conversations = AiConversation::ownedBy(Auth::id(), $shop->id)
            ->orderByDesc('last_message_at')
            ->limit(50)
            ->get(['id', 'title', 'last_message_at']);

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * Messages d'une conversation, pour la rouvrir dans la modale.
     *
     * `$code_user` DOIT figurer dans la signature, même inutilisé : le groupe de routes
     * est préfixé par `{code_user}`, et Laravel passe les paramètres d'URI dans l'ordre.
     * L'omettre décalait tout — le modèle attendu en deuxième position recevait le code
     * du compte, et la requête finissait en 500. Tous les contrôleurs de ce groupe le
     * déclarent, c'est la convention à suivre.
     */
    public function conversation(Request $request, string $code_user, AiConversation $conversation): JsonResponse
    {
        $shop = current_shop();

        abort_unless($shop && $conversation->user_id === Auth::id() && $conversation->shop_id === $shop->id, 404);

        return response()->json([
            'id' => $conversation->id,
            'title' => $conversation->title,
            'messages' => $conversation->messages()->orderBy('id')->get(['role', 'content']),
        ]);
    }

    public function destroyConversation(Request $request, string $code_user, AiConversation $conversation): JsonResponse
    {
        $shop = current_shop();

        abort_unless($shop && $conversation->user_id === Auth::id() && $conversation->shop_id === $shop->id, 404);

        // Les messages partent avec, par cascade de la clé étrangère.
        $conversation->delete();

        return response()->json(['deleted' => true]);
    }

    private function parseAnthropicError(string $errorMessage): string
    {
        // Check for specific error messages
        if (str_contains($errorMessage, 'credit balance is too low')) {
            return 'Solde crédit insuffisant. Veuillez vous connecter à votre compte Anthropic pour ajouter des crédits.';
        }

        if (str_contains($errorMessage, 'invalid api key')) {
            return 'Clé API Anthropic invalide. Veuillez contacter le support.';
        }

        if (str_contains($errorMessage, 'rate limit')) {
            return 'Trop de requêtes. Veuillez attendre quelques secondes avant de réessayer.';
        }

        if (str_contains($errorMessage, 'invalid_request_error')) {
            // Ne renvoie surtout pas l'utilisateur vers sa propre saisie. Cette famille
            // d'erreurs signale une requête mal formée par l'APPLICATION — structure de
            // la conversation, schéma d'un outil, taille du contexte — pas un texte
            // fautif ; la validation, elle, aurait déjà rejeté le message en amont.
            // L'ancien « Vérifiez votre message » faisait chercher un problème
            // inexistant : il s'affichait, entre autres, quand le service oubliait un
            // tool_result après un appel d'outils parallèles.
            return 'L\'assistant n\'a pas pu traiter cet échange : erreur technique de notre côté, pas dans votre message. Le détail est enregistré dans nos journaux. Réessayez, et signalez-le au support si cela se reproduit.';
        }

        return 'Erreur de communication avec le service IA. Veuillez réessayer.';
    }
}
