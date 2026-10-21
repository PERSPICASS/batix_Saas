# Sauvegarde et restauration de la base

La base PostgreSQL de production est sauvegardée automatiquement **chaque nuit à 3h00**
par la commande `db:backup`, planifiée dans `routes/console.php` et exécutée par le
conteneur `scheduler`.

## Où sont les sauvegardes

`storage/app/backups/`, dans le conteneur, ce qui correspond à
`/opt/batix/apps/prod/batix_Saas/storage/app/backups/` sur le VPS — `storage/` est
monté en bind depuis l'hôte. Les dumps survivent donc aux rebuilds d'image et au
`git reset --hard` du déploiement.

> **Ce montage est la condition de tout le reste.** Les services `queue` et
> `scheduler` ne l'avaient pas au départ : la sauvegarde de 3h, exécutée par
> `scheduler`, écrivait dans le système de fichiers éphémère du conteneur et
> disparaissait au déploiement suivant. La commande réussissait pourtant, et
> vérifiait bien son dump — simplement, rien n'atteignait le disque de l'hôte.
> Si un jour un service exécutant `db:backup` perd son montage `./storage`, la
> sauvegarde redevient silencieusement fictive.

Nommage : `batixpro_db-AAAA-MM-JJ_HHMMSS.dump`
Rétention : **14 jours**, les plus anciens sont supprimés à chaque exécution.

## Vérifier que ça tourne

```bash
cd /opt/batix/apps/prod/batix_Saas
C="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

# La tâche est-elle planifiée ?
$C exec -T app php artisan schedule:list

# Y a-t-il des dumps récents, et de taille plausible ?
ls -lh storage/app/backups/
```

Un dump de quelques centaines de Ko à quelques Mo est normal. **Un fichier de 0 octet
signale un échec** — mais la commande le détecte déjà et sort en erreur, voir plus bas.

## Lancer une sauvegarde à la main

```bash
$C exec -T app php artisan db:backup
```

Options : `--keep-days=30` (0 désactive la purge), `--path=/chemin/autre`.

## Restaurer

Le format est le format `custom` de PostgreSQL, à restaurer avec `pg_restore` (pas
`psql`). **Toujours restaurer d'abord dans une base jetable** pour vérifier le contenu
avant d'écraser quoi que ce soit.

```bash
DUMP=storage/app/backups/batixpro_db-2026-07-18_030000.dump

# 1. Vérification à blanc : liste le contenu sans rien écrire.
pg_restore --list "$DUMP" | head -30

# 2. Restauration dans une base de contrôle.
createdb -h 127.0.0.1 -U "$DB_USERNAME" batix_restore_check
pg_restore -h 127.0.0.1 -U "$DB_USERNAME" -d batix_restore_check \
    --no-owner --no-privileges "$DUMP"
psql -h 127.0.0.1 -U "$DB_USERNAME" -d batix_restore_check \
    -c "select count(*) from users; select count(*) from products;"

# 3. Si les comptages sont cohérents, restauration réelle.
#    --clean --if-exists supprime les objets existants avant de les recréer.
pg_restore -h 127.0.0.1 -U "$DB_USERNAME" -d batixpro_db \
    --clean --if-exists --no-owner --no-privileges "$DUMP"

# 4. Nettoyage.
dropdb -h 127.0.0.1 -U "$DB_USERNAME" batix_restore_check
```

Mettre l'application en maintenance pendant l'étape 3 :
`$C exec -T app php artisan down` puis `... artisan up`.

## Ce que la commande garantit — et ce qu'elle ne garantit pas

Après le dump, `db:backup` relit le fichier avec `pg_restore --list` et compte les
tables. Un `pg_dump` peut sortir en code 0 tout en laissant un fichier inutilisable si
le disque se remplit en cours d'écriture ; la vérification attrape ce cas. Si le dump
est vide, illisible ou sans données de table, la commande échoue et l'exception est
remontée à Sentry — une sauvegarde qui échoue en silence ne vaut pas mieux que pas de
sauvegarde du tout.

## Copie hors-site

Un dump posé sur le même disque que la base ne protège pas de la perte de la machine.
La commande téléverse donc chaque dump vérifié vers un stockage objet S3-compatible,
**dès que celui-ci est configuré**.

Tant que `BACKUP_S3_BUCKET` est vide, la sauvegarde locale se déroule normalement et
la commande affiche :

```
Off-site upload skipped — no bucket configured on the 'backups' disk.
```

C'est volontairement bruyant : « pas de copie distante » est un état que quelqu'un
doit remarquer, pas un silence.

### Configurer

Renseigner dans le `.env` du serveur (voir `.env.example` pour les endpoints B2 / R2) :

```env
BACKUP_S3_KEY=...
BACKUP_S3_SECRET=...
BACKUP_S3_BUCKET=batixpro-backups
BACKUP_S3_REGION=eu-central-003
BACKUP_S3_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
BACKUP_S3_PREFIX=prod
```

Puis `php artisan config:clear` et redémarrer `app`, `queue` et `scheduler` —
php-fpm tourne avec `opcache.validate_timestamps=0` et ne relit pas une config
modifiée sans redémarrage.

Vérifier ensuite par un envoi réel : `php artisan db:backup` doit afficher
`Off-site copy uploaded: backups:prod/...`.

### Ce que la copie distante garantit

- **La taille distante est comparée à la taille locale** après l'envoi. Le disque
  `backups` est configuré avec `'throw' => true` (contrairement au disque `s3`
  générique, qui avale ses erreurs), mais un envoi tronqué peut malgré tout se
  terminer sans erreur — d'où la comparaison.
- **La rétention s'applique aussi à distance**, avec la même durée qu'en local,
  sinon le bucket grossit indéfiniment. La purge ne touche que les fichiers `.dump`
  du préfixe configuré : un bucket partagé ne risque rien.
- **Un échec d'envoi fait échouer la commande** (code de sortie non nul) et remonte
  à Sentry, même si le dump local est bon. Une purge distante en échec, elle, n'est
  qu'un avertissement : la copie fraîche est déjà en sécurité, c'est un problème de
  coût, pas de données.

### Restaurer depuis la copie distante

```bash
# Lister ce qui est disponible
aws s3 ls s3://batixpro-backups/prod/ --endpoint-url "$BACKUP_S3_ENDPOINT"

# Récupérer un dump, puis suivre la procédure de restauration ci-dessus
aws s3 cp s3://batixpro-backups/prod/batixpro_db-2026-07-18_030000.dump . \
    --endpoint-url "$BACKUP_S3_ENDPOINT"
```

**Conseil de rétention côté fournisseur** : activer le versioning et un verrou objet
(object lock) sur le bucket. Sans cela, des identifiants compromis permettraient de
supprimer les sauvegardes en même temps que la base — c'est le mode opératoire
habituel des rançongiciels.
