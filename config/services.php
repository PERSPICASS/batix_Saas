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

];
