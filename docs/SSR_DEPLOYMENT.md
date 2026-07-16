# Déploiement du SSR (indispensable au SEO)

## Pourquoi

Sans le serveur SSR, Inertia sert une coquille vide. Vérifié sur la production le
2026-07-16 (`curl` en Googlebot sur `https://batixpro.com/`) :

| Ce que reçoit un crawler | Sans SSR | Avec SSR |
| --- | --- | --- |
| `<title>` | `BATIXPRO` sur **toutes** les pages | le vrai titre de la page |
| `<meta name="description">` | 0 | 1 |
| `<link rel="canonical">` | 0 | 1 |
| `hreflang` | 0 | 3 (fr / en / x-default) |
| Balises Open Graph | 0 | 7 à 10 |
| Blocs JSON-LD | 0 | 1 à 3 selon la page |
| Mots visibles | **0** | la page entière |

Le sitemap, lui, est du XML rendu par PHP : il fonctionne quoi qu'il arrive. D'où le
pire scénario — 45 URLs déclarées à Google, chacune renvoyant une page vide intitulée
`BATIXPRO`.

Google finit par exécuter le JavaScript, mais en seconde passe, avec du retard et sans
garantie. Surtout, **les robots Open Graph de Facebook, LinkedIn et X n'exécutent aucun
JavaScript** : sans SSR, aucun partage de lien n'affiche d'aperçu.

## Le bundle n'est pas dans le dépôt

`bootstrap/ssr` est ignoré par git (commit `028c833`). Un simple `git pull` ne le
déploie donc pas : **le build doit tourner sur le serveur**.

```bash
npm ci
npm run build          # tsc + vite build + vite build --ssr -> bootstrap/ssr/ssr.js
```

Sans `bootstrap/ssr/ssr.js`, Inertia retombe silencieusement en rendu client : le site
fonctionne, mais le SEO disparaît. C'est exactement l'état constaté en production.

## Faire tourner le serveur SSR

`php artisan inertia:start-ssr` écoute sur le port 13714 (cf. `INERTIA_SSR_URL`). Il doit
être supervisé, sinon un crash rebascule tout le site en coquille vide sans alerte.

`/etc/supervisor/conf.d/batixpro-ssr.conf` :

```ini
[program:batixpro-ssr]
process_name=%(program_name)s
command=php /var/www/batixpro/artisan inertia:start-ssr
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/batixpro-ssr.log
stopwaitsecs=10
```

```bash
sudo supervisorctl reread && sudo supervisorctl update
sudo supervisorctl start batixpro-ssr
```

`ext-pcntl` est recommandé pour que la commande gère proprement les signaux d'arrêt.

## À chaque déploiement

Le bundle SSR est chargé en mémoire au démarrage : **le redémarrer après chaque build**,
sinon il continue de servir l'ancienne version du front.

```bash
npm ci && npm run build
php artisan inertia:stop-ssr        # ou: sudo supervisorctl restart batixpro-ssr
```

## Vérifier

Le seul test qui compte est le HTML brut, sans exécution de JavaScript :

```bash
curl -s https://batixpro.com/ | grep -c 'application/ld+json'   # attendu : 3
curl -s https://batixpro.com/ | grep -o '<title[^>]*>[^<]*</title>'
```

Un `<title>BATIXPRO</title>` ou `0` bloc JSON-LD signifie que le SSR ne tourne pas.

À surveiller en continu : `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:13714/health`
doit renvoyer `200`. C'est le signal le plus direct — le site reste debout quand le SSR
tombe, seul le SEO s'éteint, donc rien d'autre ne vous préviendra.
