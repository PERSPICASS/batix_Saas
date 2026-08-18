<?php

namespace App\Services\Mcp;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
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

    /**
     * Plafond dynamique, en secondes, imposé par le budget de temps de l'appelant.
     * null = seul $timeoutSeconds s'applique.
     */
    private ?int $timeoutCapSeconds = null;

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
        $response = $this->post([
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
        $this->post([
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

        $response = $this->post([
            'jsonrpc' => '2.0',
            'id' => $this->nextId++,
            'method' => $method,
            'params' => empty($params) ? new \stdClass() : $params,
        ], ['mcp-session-id' => $this->sessionId]);

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

    /**
     * Plafonne la durée des appels suivants au temps qu'il reste à l'appelant.
     *
     * Sans cela, le timeout de 20 s par appel rend le budget de AiChatService purement
     * décoratif : deux outils enchaînés dans un même tour consomment 40 s alors que PHP
     * coupe à 30 (`max_execution_time`), et la requête meurt en erreur fatale — un 500
     * nu, sans le message d'attente prévu pour l'utilisateur. Ne peut qu'abaisser le
     * plafond, jamais l'élever.
     */
    public function limitTimeoutTo(int $seconds): void
    {
        $this->timeoutCapSeconds = max(1, $seconds);
    }

    private function effectiveTimeout(): int
    {
        return $this->timeoutCapSeconds === null
            ? $this->timeoutSeconds
            : min($this->timeoutSeconds, $this->timeoutCapSeconds);
    }

    /**
     * Envoie une requête à la passerelle en traduisant les pannes de TRANSPORT.
     *
     * Sans cette traduction, un timeout ou un refus de connexion remonte en
     * `ConnectionException` brute jusqu'au contrôleur, qui ne la reconnaît pas et
     * répond 500 « Une erreur est survenue » — alors qu'il a précisément une branche
     * dédiée pour dire à l'utilisateur que le service de données ne répond pas.
     * Le cas est loin d'être théorique : passerelle éteinte, port occupé, ou budget
     * de temps qui coupe l'appel en cours.
     *
     * @param  array<string, mixed>  $payload
     * @param  array<string, string>  $headers
     */
    private function post(array $payload, array $headers = []): Response
    {
        try {
            return $this->http()->withHeaders($headers)->post($this->baseUrl, $payload);
        } catch (ConnectionException $e) {
            throw new McpUnavailableException(
                'Passerelle MCP injoignable : ' . $e->getMessage(),
                previous: $e,
            );
        }
    }

    private function http(): PendingRequest
    {
        // Accept DOIT inclure text/event-stream : le serveur MCP répond 406 sinon.
        // On n'utilise pas acceptJson() qui écraserait cet en-tête.
        return Http::withToken($this->token)
            ->timeout($this->effectiveTimeout())
            ->asJson()
            ->withHeaders(['Accept' => 'application/json, text/event-stream']);
    }
}
