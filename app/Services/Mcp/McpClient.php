<?php

namespace App\Services\Mcp;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Client MCP (Model Context Protocol) minimal, transport « Streamable HTTP ».
 *
 * Utilisé par l'assistant IA interne (AiChatService) pour exécuter ses tools via la
 * passerelle BATIXPRO plutôt qu'en tapant la BDD en direct : une seule source de
 * tools et de sécurité, partagée avec les assistants externes. Le token Sanctum est
 * transféré verbatim ; toute l'autorisation (tenant, abilities) vit côté Laravel.
 *
 * Cycle : initialize() ouvre une session (en-tête mcp-session-id), puis listTools()
 * et callTool() la réutilisent. Les réponses arrivent en Server-Sent Events.
 */
class McpClient
{
    private const PROTOCOL_VERSION = '2024-11-05';

    private ?string $sessionId = null;

    private int $nextId = 1;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly int $timeoutSeconds = 20,
    ) {}

    /**
     * Ouvre la session MCP et confirme l'initialisation. À appeler avant tout tool.
     */
    public function initialize(): void
    {
        $response = $this->http()->post($this->baseUrl, [
            'jsonrpc' => '2.0',
            'id' => $this->nextId++,
            'method' => 'initialize',
            'params' => [
                'protocolVersion' => self::PROTOCOL_VERSION,
                'capabilities' => new \stdClass(),
                'clientInfo' => ['name' => 'batix-aichat', 'version' => '1.0.0'],
            ],
        ]);

        if (! $response->successful()) {
            throw new McpUnavailableException("Échec d'initialisation MCP (HTTP {$response->status()}).");
        }

        $this->sessionId = $response->header('mcp-session-id') ?: null;
        if ($this->sessionId === null) {
            throw new McpUnavailableException('Le serveur MCP n\'a pas renvoyé de mcp-session-id.');
        }

        // Notification obligatoire du protocole ; réponse 202 sans corps.
        $this->http()->post($this->baseUrl, [
            'jsonrpc' => '2.0',
            'method' => 'notifications/initialized',
        ]);
    }

    /**
     * Liste les tools exposés, mappés au format d'outil de l'API Anthropic
     * ({ name, description, input_schema }).
     *
     * @return array<int, array{name: string, description: string, input_schema: array}>
     */
    public function listTools(): array
    {
        $result = $this->rpc('tools/list');
        $tools = $result['tools'] ?? [];

        return array_map(static fn (array $tool): array => [
            'name' => $tool['name'],
            'description' => $tool['description'] ?? '',
            'input_schema' => $tool['inputSchema'] ?? ['type' => 'object', 'properties' => new \stdClass()],
        ], $tools);
    }

    /**
     * Exécute un tool et renvoie son contenu textuel (déjà JSON pour nos tools de
     * lecture). Une erreur métier renvoyée par le tool (isError) est retournée telle
     * quelle pour que le modèle puisse réagir — seules les pannes de transport lèvent.
     */
    public function callTool(string $name, array $arguments): string
    {
        $result = $this->rpc('tools/call', [
            'name' => $name,
            'arguments' => empty($arguments) ? new \stdClass() : $arguments,
        ]);

        $text = collect($result['content'] ?? [])
            ->firstWhere('type', 'text')['text'] ?? null;

        return $text ?? 'Aucun contenu renvoyé par le tool.';
    }

    /**
     * Envoie une requête JSON-RPC sur la session courante et renvoie le `result`.
     *
     * @return array<string, mixed>
     */
    private function rpc(string $method, array $params = []): array
    {
        if ($this->sessionId === null) {
            throw new McpUnavailableException('Session MCP non initialisée.');
        }

        $response = $this->http()
            ->withHeaders(['mcp-session-id' => $this->sessionId])
            ->post($this->baseUrl, [
                'jsonrpc' => '2.0',
                'id' => $this->nextId++,
                'method' => $method,
                'params' => empty($params) ? new \stdClass() : $params,
            ]);

        if (! $response->successful()) {
            throw new McpUnavailableException("Appel MCP {$method} en échec (HTTP {$response->status()}).");
        }

        $message = $this->decodeStreamable($response->body());

        if (isset($message['error'])) {
            $msg = $message['error']['message'] ?? 'erreur inconnue';
            throw new McpUnavailableException("Erreur MCP {$method} : {$msg}");
        }

        return $message['result'] ?? [];
    }

    /**
     * Décode une réponse « Streamable HTTP » : soit du JSON simple, soit un flux SSE
     * (`event: message\ndata: {…}`). Renvoie le message JSON-RPC (avec result/error).
     *
     * @return array<string, mixed>
     */
    private function decodeStreamable(string $body): array
    {
        $trimmed = trim($body);

        // Cas JSON direct.
        if ($trimmed !== '' && $trimmed[0] === '{') {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        // Cas SSE : on retient le dernier bloc `data:` porteur d'un result/error.
        $found = [];
        foreach (preg_split('/\r?\n/', $body) as $line) {
            if (str_starts_with($line, 'data:')) {
                $payload = trim(substr($line, 5));
                $decoded = json_decode($payload, true);
                if (is_array($decoded) && (isset($decoded['result']) || isset($decoded['error']))) {
                    $found = $decoded;
                }
            }
        }

        if (empty($found)) {
            throw new McpUnavailableException('Réponse MCP illisible.');
        }

        return $found;
    }

    private function http(): PendingRequest
    {
        // Accept DOIT inclure text/event-stream : le serveur MCP répond 406 sinon.
        // On n'utilise pas acceptJson() qui écraserait cet en-tête.
        return Http::withToken($this->token)
            ->timeout($this->timeoutSeconds)
            ->asJson()
            ->withHeaders(['Accept' => 'application/json, text/event-stream']);
    }
}
