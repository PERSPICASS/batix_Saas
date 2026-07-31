<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#F6CF15">
        <meta name="author" content="BATIX PRO">
        <meta name="robots" content="index, follow">
        {{-- Le <title>, la description et le reste des métadonnées sont posés par page via
             <Head> d'Inertia (SeoHead.tsx, Welcome.tsx) et injectés ici par @inertiaHead,
             pour rester adaptés à la locale et éviter les balises en double.

             Pas de <title inertia> de repli ici : ce placeholder n'est prévu que pour un
             rendu 100% client. Avec le SSR, @inertiaHead en rend un second, et le
             placeholder — arrivant en premier dans le <head> — l'emportait, donnant à
             CHAQUE page le titre "BATIXPRO" aux yeux des crawlers. --}}

        <!-- Favicon & PWA -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate icon" href="/favicon.ico">
        {{-- iOS ignore le SVG pour l'icone d'ecran d'accueil : il lui faut un PNG. --}}
        <link rel="apple-touch-icon" href="/icon-192.png">
        <link rel="manifest" href="/manifest.json">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        {{-- Le bandeau « 2 mois offerts » est rendu côté serveur pour tout le monde :
             le faire apparaître après hydratation décalerait la page vers le bas une
             fois affichée, ce que Google compte en CLS. Pour le visiteur qui l'a déjà
             masqué, il faut donc le cacher AVANT la première peinture — d'où ce
             script, qui doit rester ici, synchrone et avant tout rendu. Le composant
             React le retire ensuite proprement du DOM (AnnualPromoBanner.tsx). --}}
        <style>html[data-promo-dismissed="1"] [data-promo-banner]{display:none}</style>
        <script>
            try {
                // sessionStorage, pas localStorage : le bandeau sert à faire souscrire,
                // sa fermeture ne vaut donc que pour la visite en cours.
                if (sessionStorage.getItem('batix_annual_promo_dismissed') === '1') {
                    document.documentElement.dataset.promoDismissed = '1';
                }
            } catch (e) {
                // Stockage indisponible (navigation privée stricte) : le bandeau
                // s'affiche, ce qui est le comportement dégradé acceptable.
            }
        </script>

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
