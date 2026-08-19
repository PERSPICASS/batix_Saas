<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | PawaPay Mobile Money Hub
    |--------------------------------------------------------------------------
    */
    'pawapay' => [
        'api_token' => env('PAWAPAY_API_TOKEN', ''),
        'sandbox'   => env('PAWAPAY_SANDBOX', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Jèko Payment Platform
    |--------------------------------------------------------------------------
    */
    'jeko' => [
        'api_key'        => env('JEKO_API_KEY', ''),
        'api_key_id'     => env('JEKO_API_KEY_ID', ''),
        'store_id'       => env('JEKO_STORE_ID', ''),
        'webhook_secret' => env('JEKO_WEBHOOK_SECRET', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Numéros de paiement Batix
    |--------------------------------------------------------------------------
    */
    'payment' => [
        'wave'         => env('PAYMENT_WAVE_NUMBER',         ''),
        'orange_money' => env('PAYMENT_ORANGE_NUMBER',       ''),
        'mtn_money'    => env('PAYMENT_MTN_NUMBER',          ''),
        'moov_money'   => env('PAYMENT_MOOV_NUMBER',         ''),
        'virement'     => env('PAYMENT_VIREMENT_RIB',        ''),
        'carte'        => env('PAYMENT_CARTE_INFO',          ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Anthropic AI Agent
    |--------------------------------------------------------------------------
    */
    'anthropic' => [
        'key' => env('ANTHROPIC_API_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Passerelle MCP BATIXPRO
    |--------------------------------------------------------------------------
    | Endpoint Streamable HTTP du serveur MCP par lequel l'assistant IA interne
    | exécute ses tools (voir App\Services\Mcp\McpClient). En prod (Docker),
    | pointer sur le réseau interne : http://batixpro-mcp:3000/mcp.
    */
    'batixpro_mcp' => [
        'url' => env('BATIXPRO_MCP_URL', 'http://localhost:3111/mcp'),
    ],

    /*
    |--------------------------------------------------------------------------
    | LemonSqueezy Payment Platform
    |--------------------------------------------------------------------------
    */
    'lemonsqueezy' => [
        'api_key'   => env('LEMONSQUEEZY_API_KEY', ''),
        'store_id'  => env('LEMONSQUEEZY_STORE_ID', ''),
        'webhook_secret' => env('LEMONSQUEEZY_WEBHOOK_SECRET', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Moneroo — orchestration Mobile Money et carte
    |--------------------------------------------------------------------------
    | La clé API ne doit jamais être envoyée au navigateur. Le secret webhook est
    | distinct : il signe le corps brut reçu dans X-Moneroo-Signature.
    */
    'moneroo' => [
        'enabled'        => env('MONEROO_ENABLED', false),
        'api_key'        => env('MONEROO_API_KEY', ''),
        'webhook_secret' => env('MONEROO_WEBHOOK_SECRET', ''),
        'base_url'       => env('MONEROO_BASE_URL', 'https://api.moneroo.io'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Paddle Payment Platform
    |--------------------------------------------------------------------------
    */
    'paddle' => [
        'env' => env('PADDLE_ENV', 'sandbox'),
        'secret' => env('PADDLE_API_KEY'),
        'webhook_secret' => env('PADDLE_WEBHOOK_SECRET'),
    ],

];
