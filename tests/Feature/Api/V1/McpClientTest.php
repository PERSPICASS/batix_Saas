<?php

namespace Tests\Feature\Api\V1;

use App\Services\Mcp\McpClient;
use App\Services\Mcp\McpUnavailableException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Verrouille le protocole du client MCP (transport Streamable HTTP) : capture du
 * mcp-session-id, parsing des réponses Server-Sent Events, mapping des tools au
 * format Anthropic, et remontée d'erreur en McpUnavailableException.
 */
class McpClientTest extends TestCase
{
    private const URL = 'http://mcp.test/mcp';

    /** Fabrique un corps SSE porteur d'un message JSON-RPC. */
    private function sse(array $message): string
    {
        return "event: message\ndata: " . json_encode($message) . "\n\n";
    }

    public function test_initialize_captures_session_and_lists_tools_in_anthropic_format(): void
    {
        Http::fake(function (Request $request) {
            $method = $request->data()['method'] ?? null;

            return match ($method) {
                'initialize' => Http::response(
                    $this->sse(['jsonrpc' => '2.0', 'id' => 1, 'result' => ['protocolVersion' => '2024-11-05']]),
                    200,
                    ['mcp-session-id' => 'sess-123', 'Content-Type' => 'text/event-stream'],
                ),
                'notifications/initialized' => Http::response('', 202),
                'tools/list' => Http::response(
                    $this->sse(['jsonrpc' => '2.0', 'id' => 2, 'result' => ['tools' => [[
                        'name' => 'product_search',
                        'description' => 'Recherche produits',
                        'inputSchema' => ['type' => 'object', 'properties' => ['search' => ['type' => 'string']]],
                    ]]]]),
                    200,
                    ['Content-Type' => 'text/event-stream'],
                ),
                default => Http::response('', 404),
            };
        });

        $mcp = new McpClient(self::URL, 'tok-abc');
        $mcp->initialize();
        $tools = $mcp->listTools();

        $this->assertCount(1, $tools);
        $this->assertSame('product_search', $tools[0]['name']);
        // Clé renommée inputSchema -> input_schema pour l'API Anthropic.
        $this->assertArrayHasKey('input_schema', $tools[0]);
        $this->assertSame('object', $tools[0]['input_schema']['type']);

        // Le token est transféré verbatim en Bearer, et Accept inclut text/event-stream.
        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Bearer tok-abc')
            && str_contains($r->header('Accept')[0], 'text/event-stream'));
    }

    public function test_call_tool_returns_text_content(): void
    {
        Http::fake(function (Request $request) {
            $method = $request->data()['method'] ?? null;

            if ($method === 'initialize') {
                return Http::response($this->sse(['jsonrpc' => '2.0', 'id' => 1, 'result' => []]), 200, ['mcp-session-id' => 's1']);
            }
            if ($method === 'tools/call') {
                return Http::response($this->sse(['jsonrpc' => '2.0', 'id' => 2, 'result' => [
                    'content' => [['type' => 'text', 'text' => '{"data":{"total_revenue":4000}}']],
                ]]), 200);
            }

            return Http::response('', 202);
        });

        $mcp = new McpClient(self::URL, 'tok');
        $mcp->initialize();

        $this->assertSame('{"data":{"total_revenue":4000}}', $mcp->callTool('sales_summary', ['days' => 30]));
    }

    public function test_missing_session_header_throws(): void
    {
        Http::fake([
            self::URL => Http::response($this->sse(['jsonrpc' => '2.0', 'id' => 1, 'result' => []]), 200),
        ]);

        $mcp = new McpClient(self::URL, 'tok');

        $this->expectException(McpUnavailableException::class);
        $mcp->initialize();
    }

    public function test_jsonrpc_error_becomes_mcp_exception(): void
    {
        Http::fake(function (Request $request) {
            $method = $request->data()['method'] ?? null;

            if ($method === 'initialize') {
                return Http::response($this->sse(['jsonrpc' => '2.0', 'id' => 1, 'result' => []]), 200, ['mcp-session-id' => 's1']);
            }
            if ($method === 'tools/list') {
                return Http::response($this->sse(['jsonrpc' => '2.0', 'id' => 2, 'error' => ['code' => -32000, 'message' => 'boom']]), 200);
            }

            return Http::response('', 202);
        });

        $mcp = new McpClient(self::URL, 'tok');
        $mcp->initialize();

        $this->expectException(McpUnavailableException::class);
        $mcp->listTools();
    }
}
