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

## Trois choses à savoir

1. **`INERTIA_SSR_URL` doit désigner le service, pas localhost.** Le défaut
   (`127.0.0.1:13714`) pointerait le conteneur `app` sur lui-même. Le Dockerfile fait bien
   un `config:cache` au *build*, mais le déploiement (`.github/workflows/deploy.yml`,
   étape 6) enchaîne `optimize:clear` puis `optimize` **dans le conteneur démarré** : la
   config est donc reconstruite au runtime, et une variable passée par compose est prise
   en compte. Laravel charge le `.env` en mode immutable, donc **les variables d'env du
   conteneur l'emportent** sur le fichier.
2. **Le bundle a besoin de `node_modules` à l'exécution** — il importe `react-dom/server`,
   `@inertiajs/core` et consorts. Ne pas élaguer `node_modules` de l'image.
3. **Quand le SSR tombe, le site continue de fonctionner.** Aucune erreur, aucune alerte :
   seul le SEO s'éteint, en silence. D'où le `restart` et le healthcheck ci-dessous.

## Mise en place

Le déploiement est automatique sur push vers `prod` (GitHub Actions → SSH VPS →
`/opt/batix/apps/prod/batix_Saas`). Il reconstruit et relance **tous** les services
déclarés : une fois le service `ssr` ajouté aux fichiers compose, chaque déploiement le
reconstruit et le redémarre tout seul — y compris le rechargement du bundle, qui est lu
en mémoire au démarrage.

> ⚠️ `docker-compose.yml` et `docker-compose.prod.yml` **ne sont pas versionnés** : ils
> n'existent que sur le serveur. Les modifications ci-dessous se font donc directement
> là-bas, et survivent au `git reset --hard` du déploiement (fichiers non suivis).

### Service `ssr` — à ajouter à `docker-compose.prod.yml`

Calqué sur `queue`/`scheduler` : même image, donc bundle et `node_modules` déjà présents.
Aucun volume — le bundle vit dans l'image, et les volumes montés (`public`, `./storage`,
`./bootstrap/cache`) ne recouvrent pas `bootstrap/ssr/`.

```yaml
  ssr:
    build:
      context: .
      dockerfile: docker/app/Dockerfile
    container_name: batix_prod_ssr
    restart: unless-stopped
    working_dir: /var/www/html
    env_file:
      - .env
    extra_hosts:
      - "host.docker.internal:host-gateway"
    command: sh -lc "node bootstrap/ssr/ssr.js"
    environment:
      - TMPDIR=/tmp
      # Fait charger à React son build de production (le bundle prend sinon
      # react-dom-server-legacy.node.development.js, nettement plus lent).
      - NODE_ENV=production
    networks:
      - prod_internal
    healthcheck:
      # `node` et pas `curl` : l'étage production de l'image n'embarque pas curl.
      test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:13714/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
```

Pas de `ports:` — le SSR ne doit rester joignable que depuis `prod_internal`. Docker
résout `ssr` par le nom du **service** (le `container_name` ne change rien à ça).

Et sur le service **`app`**, pour qu'il sache où joindre le SSR :

```yaml
  app:
    environment:
      - TMPDIR=/tmp
      - INERTIA_SSR_ENABLED=true
      - INERTIA_SSR_URL=http://ssr:13714
    depends_on:
      - ssr
```

`environment:` l'emporte sur `env_file:`, donc inutile de toucher au `.env` du serveur.

### Déployer

Un `git push` sur `prod` suffit : le workflow reconstruit et relance tout. Manuellement :

```bash
cd /opt/batix/apps/prod/batix_Saas
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build ssr app
```

## Vérifier

Le seul test qui compte est le HTML brut, sans exécution de JavaScript :

```bash
curl -s https://batixpro.com/ | grep -o '<title[^>]*>[^<]*</title>'   # attendu : le vrai titre
curl -s https://batixpro.com/ | grep -c 'application/ld+json'         # attendu : 3
```

Un `<title>BATIXPRO</title>`, ou `0` bloc JSON-LD, signifie que le SSR ne tourne pas.

Depuis le serveur (`cd /opt/batix/apps/prod/batix_Saas`, et `C="docker compose -f
docker-compose.yml -f docker-compose.prod.yml"`) :

```bash
$C ps ssr                                   # doit être "healthy"
$C logs --tail=20 ssr                       # attendu : "Inertia SSR server started."
$C exec -T app php artisan tinker --execute="echo config('inertia.ssr.url');"
```

Si la dernière commande affiche encore `127.0.0.1:13714`, la config cachée est périmée :
relancer `$C exec -T app php artisan optimize:clear && $C exec -T app php artisan optimize`
(c'est ce que fait l'étape 6 du déploiement).

Le bundle SSR vit dans l'**image**, pas dans le volume `batix_prod_batix_public` que le
déploiement supprime : rebuild obligatoire pour le mettre à jour, un simple `restart` du
conteneur rejouerait l'ancien front.
