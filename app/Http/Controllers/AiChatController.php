<?php

namespace App\Http\Controllers;

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
                'history' => 'array|max:20',
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

            $reply = AiChatService::chat(
                $validated['message'],
                $validated['history'] ?? [],
                $shopIds,
                $user,
                $shop->name,
            );

            return response()->json([
                'reply' => $reply,
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
            return 'Requête invalide. Veuillez vérifier votre message et réessayer.';
        }

        return 'Erreur de communication avec le service IA. Veuillez réessayer.';
    }
}
