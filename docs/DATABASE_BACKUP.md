# Sauvegarde et restauration de la base

La base PostgreSQL de production est sauvegardée automatiquement **chaque nuit à 3h00**
par la commande `db:backup`, planifiée dans `routes/console.php` et exécutée par le
conteneur `scheduler`.

## Où sont les sauvegardes

`storage/app/backups/`, dans le conteneur, ce qui correspond à
`/opt/batix/apps/prod/batix_Saas/storage/app/backups/` sur le VPS — `storage/` est
monté en bind depuis l'hôte (`docker-compose.prod.yml:19`). Les dumps survivent donc
aux rebuilds d'image et au `git reset --hard` du déploiement.

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

En revanche, **les dumps sont sur le même disque que la base**. Ils protègent contre
une erreur applicative, une migration ratée ou une suppression accidentelle, mais
**pas contre la perte du VPS**. Une copie hors-site (S3, Backblaze B2, `rsync` vers
une autre machine) reste à mettre en place ; c'est le dernier maillon manquant.

Piste la plus simple une fois les accès obtenus : ajouter un disque `s3` dans
`config/filesystems.php` et téléverser le fichier en fin de commande, ou brancher
`rclone` sur le répertoire depuis l'hôte.
