#!/usr/bin/env bash
#
# Régénère les vignettes de partage social (public/og-image.jpg et og-image-en.jpg).
#
#   ./scripts/og-image/generate.sh
#
# Ces images sont ce que Facebook, LinkedIn et WhatsApp affichent quand un lien
# BATIX PRO est partagé. Elles sont versionnées : ce script ne sert qu'à les
# refaire après un changement de logo, de palette ou d'accroche.
#
# Le rendu passe par Chrome headless plutôt que par GD : la police du site
# (Figtree, servie par fonts.bunny.net) et les dégradés CSS sont alors les vrais,
# pas une approximation. Chrome doit donc avoir accès au réseau au moment du run.
#
# Le 1200×630 est imposé par les scrapers sociaux — en dessous, ou à un autre
# ratio, l'aperçu tombe en petite vignette carrée au lieu d'une grande image.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TPL="$ROOT/scripts/og-image/template.html"
WORK="$(mktemp -d)"
PORT=8899
trap 'rm -rf "$WORK"; [ -n "${SRV:-}" ] && kill "$SRV" 2>/dev/null || true' EXIT

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
if [ ! -x "$CHROME" ]; then
    echo "Chrome introuvable : $CHROME" >&2
    echo "Renseigner la variable CHROME avec le chemin du binaire." >&2
    exit 1
fi

# Les logos sont inlinés en base64 : Chrome headless charge la page depuis un
# serveur temporaire, un chemin relatif vers public/images n'y résoudrait pas.
LOGO=$(base64 < "$ROOT/public/images/logo-batixpro.png" | tr -d '\n')
MARK=$(base64 < "$ROOT/public/images/logo-batixpro-mark.png" | tr -d '\n')

render() {
    local html="$1" out="$2"
    "$CHROME" --headless --disable-gpu --hide-scrollbars \
        --force-device-scale-factor=2 --window-size=1200,630 \
        --default-background-color=ffffffff \
        --screenshot="$WORK/shot.png" "http://127.0.0.1:$PORT/$html" 2>/dev/null
    # Rendu en 2x puis réduit : le texte reste net après compression JPEG.
    sips -z 630 1200 "$WORK/shot.png" >/dev/null
    sips -s format jpeg -s formatOptions 88 "$WORK/shot.png" --out "$ROOT/public/$out" >/dev/null
    echo "  public/$out — $(sips -g pixelWidth -g pixelHeight "$ROOT/public/$out" | tr -d '\n' | grep -oE '[0-9]+' | paste -sd× -)"
}

python3 - "$TPL" "$WORK" "$LOGO" "$MARK" <<'PY'
import sys
tpl_path, work, logo, mark = sys.argv[1:5]
tpl = open(tpl_path, encoding='utf-8').read()

fr = tpl
en = (tpl
      .replace('lang="fr"', 'lang="en"')
      .replace('Le logiciel de gestion<br>des <span class="hl">quincailleries</span>',
               'Management software<br>for <span class="hl">hardware stores</span>')
      .replace('Ventes &middot; Stock &middot; Caisse &middot; <b>Multi-boutiques</b>',
               'Sales &middot; Inventory &middot; POS &middot; <b>Multi-store</b>')
      .replace('Essai gratuit 14 jours', '14-day free trial')
      .replace('Sans carte bancaire', 'No credit card'))

for name, html in (('og.html', fr), ('og-en.html', en)):
    open(f'{work}/{name}', 'w', encoding='utf-8').write(
        html.replace('__LOGO__', logo).replace('__MARK__', mark))
PY

php -S "127.0.0.1:$PORT" -t "$WORK" >/dev/null 2>&1 &
SRV=$!
sleep 1

echo "Génération des vignettes de partage :"
render og.html og-image.jpg
render og-en.html og-image-en.jpg
echo "Terminé."
