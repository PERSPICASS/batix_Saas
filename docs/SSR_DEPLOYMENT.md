# Déploiement du SSR (indispensable au SEO)

## Pourquoi

Sans serveur SSR, Inertia sert une coquille vide. Constaté sur la production le
2026-07-16 (`curl` en Googlebot sur `https://batixpro.com/`, `/tarifs`, `/blog`) :

| Ce que reçoit un crawler | Sans SSR (état actuel) | Avec SSR |
| --- | --- | --- |
| `<title>` | `BATIXPRO` sur **toutes** les pages | le vrai titre de la page |
| `<meta name="description">` | 0 | 1 |
| `<link rel="canonical">` | 0 | 1 |
| `hreflang` | 0 | 3 (fr / en / x-default) |
| Balises Open Graph | 0 | 7 à 10 |
| Blocs JSON-LD | 0 | 1 à 3 selon la page |
| Mots visibles | **0** | la page entière |

`/sitemap.xml` est du XML rendu par PHP : il fonctionne quoi qu'il arrive. D'où le pire
scénario — 45 URLs déclarées à Google, chacune renvoyant une page vide intitulée
`BATIXPRO`.

Google exécute le JavaScript, mais en seconde passe, avec du retard. Surtout, **les
robots Open Graph de Facebook, LinkedIn et X n'en exécutent aucun** : sans SSR, aucun
lien partagé n'affiche d'aperçu.

## Pourquoi ça n'a jamais tourné

`docker/app/Dockerfile` a deux étages :

- **`base`** installe `nodejs`/`npm` et lance `npm run build`, ce qui produit bien
  `bootstrap/ssr/ssr.js` ;
- **`production`** repart d'une image nue, recopie l'application (`COPY --from=base`) —
  bundle et `node_modules` inclus — mais n'installait **pas Node**, et son `CMD` ne lance
  qu'un `php-fpm`.

Le bundle SSR était donc présent dans l'image, sans aucun binaire capable de l'exécuter.
`nodejs` est désormais installé dans l'étage `production`.

À noter : `docker/app/supervisor.conf` et l'étage `base` ne sont pas utilisés en prod.

## Trois choses à savoir avant de toucher au serveur

1. **`config:cache` tourne au *build*** (Dockerfile, avant l'étage production), et faute
   de `.dockerignore`, `COPY . .` embarque le `.env` du serveur dans l'image. Toute la
   configuration est donc figée au moment du build : une variable ajoutée au runtime par
   compose serait **ignorée**. `INERTIA_SSR_URL` doit être dans `.env` **avant** de
   construire.
2. **Le bundle a besoin de `node_modules` à l'exécution** — il importe `react-dom/server`,
   `@inertiajs/core` et consorts. Ne pas élaguer `node_modules` de l'image.
3. **Quand le SSR tombe, le site continue de fonctionner.** Aucune erreur, aucune alerte :
   seul le SEO s'éteint, en silence. D'où le `restart` et le healthcheck ci-dessous.

## Mise en place

### 1. `.env` sur le serveur — *avant* le build

```dotenv
INERTIA_SSR_ENABLED=true
INERTIA_SSR_URL=http://ssr:13714
```

`ssr` est le nom du service compose : c'est le DNS interne de Docker qui le résout depuis
le conteneur `app`. Le défaut (`127.0.0.1:13714`) ne fonctionnerait pas — il désignerait
le conteneur `app` lui-même.

### 2. Service `ssr` dans le `docker-compose.yml` du serveur

Il réutilise **la même image** que `app` : le bundle et `node_modules` y sont déjà.

```yaml
  ssr:
    # Reprendre à l'identique l'image / build du service `app`
    image: <même image que app>
    command: node bootstrap/ssr/ssr.js
    restart: unless-stopped
    environment:
      # Fait charger à React son build de production (le bundle prend sinon
      # react-dom-server-legacy.node.development.js, nettement plus lent).
      NODE_ENV: production
    expose:
      - "13714"          # interne au réseau docker : ne jamais publier ce port
    networks:
      - <même réseau que app>
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:13714/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
```

`expose` et non `ports` : le SSR ne doit être joignable que depuis le réseau interne.

### 3. Construire et démarrer

```bash
cd /opt/batix/apps/dev/batix_Saas
docker compose build app ssr
docker compose up -d app ssr
```

## À chaque déploiement

Le bundle est chargé en mémoire au démarrage : **redémarrer `ssr` après chaque build**,
sinon il continue de servir l'ancien front.

```bash
docker compose build app ssr && docker compose up -d app ssr
```

## Vérifier

Le seul test qui compte est le HTML brut, sans exécution de JavaScript :

```bash
curl -s https://batixpro.com/ | grep -o '<title[^>]*>[^<]*</title>'   # attendu : le vrai titre
curl -s https://batixpro.com/ | grep -c 'application/ld+json'         # attendu : 3
```

Un `<title>BATIXPRO</title>`, ou `0` bloc JSON-LD, signifie que le SSR ne tourne pas.

Depuis le serveur :

```bash
docker compose ps ssr                    # doit être "healthy"
docker compose logs --tail=20 ssr        # attendu : "Inertia SSR server started."
docker compose exec app php -r "echo config('inertia.ssr.url');"   # doit afficher http://ssr:13714
```

Si cette dernière commande affiche encore `127.0.0.1:13714`, c'est que `.env` a été modifié
**après** le build : reconstruire.
