<?php

namespace Tests\Feature\Api\V1;

use App\Services\AiChatService;
use App\Services\Mcp\McpClient;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Verrouille le contrat des appels d'outils parallèles.
 *
 * Le modèle appelle volontiers plusieurs tools dans un même tour — « un devis pour
 * Matthieu avec 30 pistolets » demande de chercher le client ET le produit. L'API
 * Anthropic exige alors UN `tool_result` par bloc `tool_use` dans le message suivant :
 * il en manque un et toute la conversation part en `invalid_request_error`
 * (« tool_use ids were found without tool_result blocks »).
 *
 * Le service n'en exécutait qu'un seul tout en réinjectant la réponse entière du
 * modèle, blocs `tool_use` compris — donc systématiquement rejeté dès que le modèle
 * en émettait deux.
 */
class AiChatToolLoopTest extends TestCase
{
    /** Bloc `tool_use` tel que le SDK Anthropic le renvoie : un objet, pas un tableau. */
    private function toolUseBlock(string $id, string $name, array $input): object
    {
        return (object) ['type' => 'tool_use', 'id' => $id, 'name' => $name, 'input' => (object) $input];
    }

    private function executeToolCalls(array $blocks, McpClient $mcp, int $shopId, ?float $deadline = null): array
    {
        $method = new ReflectionMethod(AiChatService::class, 'executeToolCalls');
        $method->setAccessible(true);

        // Par défaut, un budget hors de portée : les tests d'appels parallèles ne
        // portent pas sur le temps.
        return $method->invoke(null, $blocks, $mcp, $shopId, $deadline ?? microtime(true) + 3600);
    }

    private function timeBudgetSeconds(): int
    {
        $method = new ReflectionMethod(AiChatService::class, 'timeBudgetSeconds');
        $method->setAccessible(true);

        return $method->invoke(null);
    }

    public function test_every_parallel_tool_use_gets_its_own_tool_result(): void
    {
        $blocks = [
            $this->toolUseBlock('toolu_client', 'customer_search', ['query' => 'Matthieu Aka']),
            $this->toolUseBlock('toolu_produit', 'product_search', ['query' => 'Pistolet à peinture 600W']),
        ];

        $mcp = $this->createMock(McpClient::class);
        $mcp->method('callTool')->willReturn('{"data":[]}');

        $results = $this->executeToolCalls($blocks, $mcp, 42);

        $this->assertCount(2, $results, 'Un tool_result doit répondre à chaque tool_use.');
        $this->assertSame(
            ['toolu_client', 'toolu_produit'],
            array_column($results, 'tool_use_id'),
            'Chaque tool_result doit référencer son propre tool_use_id, dans l\'ordre.'
        );
        $this->assertSame(['tool_result', 'tool_result'], array_column($results, 'type'));
    }

    public function test_the_active_shop_is_forced_on_every_call_not_just_the_first(): void
    {
        $blocks = [
            $this->toolUseBlock('toolu_1', 'customer_search', ['query' => 'Matthieu']),
            // Le modèle tente une autre boutique : elle doit être écrasée, pas honorée.
            $this->toolUseBlock('toolu_2', 'product_search', ['query' => 'Pistolet', 'shop_id' => 999]),
        ];

        $seen = [];
        $mcp = $this->createMock(McpClient::class);
        $mcp->method('callTool')->willReturnCallback(function (string $name, array $args) use (&$seen) {
            $seen[] = $args['shop_id'];

            return '{}';
        });

        $this->executeToolCalls($blocks, $mcp, 42);

        $this->assertSame([42, 42], $seen);
    }

    public function test_no_tool_use_yields_no_tool_result(): void
    {
        $mcp = $this->createMock(McpClient::class);
        $mcp->expects($this->never())->method('callTool');

        $this->assertSame([], $this->executeToolCalls([], $mcp, 42));
    }

    // ------------------------------------------------------------ budget de temps

    public function test_an_exhausted_budget_stops_the_calls(): void
    {
        $blocks = [
            $this->toolUseBlock('toolu_1', 'customer_search', []),
            $this->toolUseBlock('toolu_2', 'product_search', []),
        ];

        $mcp = $this->createMock(McpClient::class);
        $mcp->expects($this->never())->method('callTool');

        // Échéance déjà passée : aucun appel ne doit partir. runConversation relit
        // l'horloge juste après et abandonne le tour, donc les tool_result manquants
        // ne seront jamais transmis à l'API.
        $results = $this->executeToolCalls($blocks, $mcp, 42, microtime(true) - 1);

        $this->assertSame([], $results);
    }

    public function test_each_call_is_capped_to_the_remaining_budget(): void
    {
        $blocks = [$this->toolUseBlock('toolu_1', 'customer_search', [])];

        $caps = [];
        $mcp = $this->createMock(McpClient::class);
        $mcp->method('limitTimeoutTo')->willReturnCallback(function (int $s) use (&$caps) {
            $caps[] = $s;
        });
        $mcp->method('callTool')->willReturn('{}');

        // Sans ce plafond, un appel de 20 s dépasserait le budget de l'intérieur, sans
        // que la boucle ne reprenne la main pour s'en apercevoir.
        $this->executeToolCalls($blocks, $mcp, 42, microtime(true) + 3);

        $this->assertCount(1, $caps);
        $this->assertLessThanOrEqual(3, $caps[0]);
        $this->assertGreaterThan(0, $caps[0]);
    }

    // -------------------------------------------------- relecture après écriture

    public function test_a_write_is_followed_by_a_read_back_of_the_document(): void
    {
        $blocks = [$this->toolUseBlock('toolu_w', 'invoice_update', ['invoice_id' => 7])];

        $calls = [];
        $mcp = $this->createMock(McpClient::class);
        $mcp->method('callTool')->willReturnCallback(function (string $name, array $args) use (&$calls) {
            $calls[] = [$name, $args];

            return $name === 'invoice_update'
                ? '{"data":{"id":7,"total":1000}}'
                // La relecture renvoie l'état RÉEL, ici différent de ce que l'écriture
                // a échoué à persister : c'est exactement le cas qu'on veut rendre visible.
                : '{"data":{"id":7,"total":5160000,"items":[{"quantity":50},{"quantity":100}]}}';
        });

        $results = $this->executeToolCalls($blocks, $mcp, 42);

        $this->assertSame(['invoice_update', 'invoice_get'], array_column($calls, 0));
        $this->assertSame(7, $calls[1][1]['invoice_id'], 'La relecture doit porter sur le document écrit.');
        $this->assertSame(42, $calls[1][1]['shop_id'], 'La relecture reste cantonnée à la boutique courante.');

        $content = json_decode($results[0]['content'], true);
        $this->assertSame(1000, $content['ecriture']['data']['total']);
        $this->assertSame(5160000, $content['relecture']['data']['total']);
        $this->assertArrayHasKey('consigne', $content);
    }

    public function test_a_failed_write_is_not_read_back(): void
    {
        $blocks = [$this->toolUseBlock('toolu_w', 'quote_create', [])];

        $calls = [];
        $mcp = $this->createMock(McpClient::class);
        $mcp->method('callTool')->willReturnCallback(function (string $name, array $args) use (&$calls) {
            $calls[] = $name;

            return '{"error":{"code":"validation_error","message":"Données invalides."}}';
        });

        $results = $this->executeToolCalls($blocks, $mcp, 42);

        // Rien à relire, et le message d'erreur doit remonter intact — l'envelopper
        // masquerait au modèle la raison du refus.
        $this->assertSame(['quote_create'], $calls);
        $this->assertStringContainsString('validation_error', $results[0]['content']);
    }

    public function test_an_interrupted_turn_never_claims_success(): void
    {
        $method = new ReflectionMethod(AiChatService::class, 'unfinishedMessage');
        $method->setAccessible(true);

        // Sans écriture tentée : on peut affirmer que rien n'a bougé.
        $none = $method->invoke(null, 'Trop d\'étapes.', 0);
        $this->assertStringContainsString("Aucune modification n'a été enregistrée", $none);

        // Avec écritures tentées : surtout PAS la même phrase. Certaines ont pu aboutir
        // avant l'interruption, et envoyer l'utilisateur recommencer par-dessus une
        // modification déjà passée serait pire que de ne rien dire.
        $some = $method->invoke(null, 'Trop d\'étapes.', 2);
        $this->assertStringNotContainsString("Aucune modification n'a été enregistrée", $some);
        $this->assertStringContainsString('état réel', $some);
    }

    public function test_a_read_only_tool_is_not_wrapped(): void
    {
        $blocks = [$this->toolUseBlock('toolu_r', 'product_search', ['search' => 'pistolet'])];

        $mcp = $this->createMock(McpClient::class);
        $mcp->expects($this->once())->method('callTool')->willReturn('{"data":[]}');

        $results = $this->executeToolCalls($blocks, $mcp, 42);

        $this->assertSame('{"data":[]}', $results[0]['content']);
    }

    public function test_the_budget_stays_below_the_php_execution_limit(): void
    {
        // ini_set explicite : en CLI, max_execution_time vaut 0, si bien qu'une simple
        // lecture de la valeur ambiante n'aurait jamais exercé la branche qui compte —
        // celle du serveur web, où PHP coupe vraiment.
        $previous = ini_get('max_execution_time');

        try {
            ini_set('max_execution_time', '30');

            // Tout l'intérêt du budget : rendre la main AVANT que PHP ne tue la requête
            // par une erreur fatale, que le contrôleur ne peut pas rattraper.
            $this->assertSame(25, $this->timeBudgetSeconds());

            ini_set('max_execution_time', '60');
            $this->assertSame(55, $this->timeBudgetSeconds());

            // 0 = illimité (CLI, file d'attente) : on borne quand même.
            ini_set('max_execution_time', '0');
            $this->assertSame(55, $this->timeBudgetSeconds());

            // Limite très basse : le budget reste positif plutôt que de passer négatif.
            ini_set('max_execution_time', '3');
            $this->assertSame(5, $this->timeBudgetSeconds());
        } finally {
            ini_set('max_execution_time', (string) $previous);
        }
    }
}
