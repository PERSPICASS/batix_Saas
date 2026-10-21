<?php

namespace App\Services\Mcp;

use RuntimeException;

/**
 * Levée quand la passerelle MCP est injoignable ou renvoie une erreur de transport.
 * Attrapée par AiChatController pour présenter un message clair à l'utilisateur.
 */
class McpUnavailableException extends RuntimeException
{
}
