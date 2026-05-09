<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#FBBF24">
        <meta name="author" content="BATIX PRO">
        <meta name="robots" content="index, follow">
        <meta name="description" content="BATIX PRO est le logiciel de gestion de quincaillerie pensé pour les équipes terrain. Ventes, stock, achats fournisseurs et rapports en temps réel. Essai gratuit 14 jours, sans carte bancaire.">
        <meta name="keywords" content="logiciel quincaillerie, gestion stock quincaillerie, caisse quincaillerie, logiciel vente comptoir, gestion boutique, BATIX PRO, SaaS quincaillerie">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Favicon & PWA -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/favicon.svg">
        <link rel="manifest" href="/manifest.json">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
            }
        </script>
    </body>
</html>
