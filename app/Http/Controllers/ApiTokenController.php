<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ApiTokenController extends Controller
{
    /**
     * Seul le propriétaire du compte (super_admin) gère les tokens d'intégration :
     * ils donnent un accès API à l'ensemble du compte, pas à une seule boutique.
     */
    private function authorizeOwner(): void
    {
        if (Auth::user()->role !== 'super_admin') {
            abort(403);
        }
    }

    public function index(): Response
    {
        $this->authorizeOwner();

        $tokens = Auth::user()->tokens()
            ->latest()
            ->get(['id', 'name', 'abilities', 'last_used_at', 'expires_at', 'created_at']);

        return Inertia::render('Settings/ApiTokens', [
            'tokens' => $tokens,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeOwner();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'expires_in_days' => 'nullable|integer|min:1|max:730',
        ]);

        $expiresAt = !empty($validated['expires_in_days'])
            ? now()->addDays((int) $validated['expires_in_days'])
            : null;

        $token = Auth::user()->createToken($validated['name'], ['*'], $expiresAt);

        ActivityLogger::message('create', 'api_token_created', ['name' => $validated['name']]);

        return back()->with([
            'success' => 'Token créé avec succès.',
            'plainTextToken' => $token->plainTextToken,
        ]);
    }

    public function destroy(Request $request, int $tokenId): RedirectResponse
    {
        $this->authorizeOwner();

        $token = Auth::user()->tokens()->findOrFail($tokenId);
        $name = $token->name;
        $token->delete();

        ActivityLogger::message('delete', 'api_token_revoked', ['name' => $name]);

        return back()->with('success', 'Token révoqué.');
    }
}
