import { InputHTMLAttributes, useEffect, useState } from 'react';
import { isDivisibleUnit, parseQuantity } from '@/utils/quantity';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
    value: number | string | null | undefined;
    onChange: (quantity: number | null) => void;
    /** Unité du produit : sans elle, la saisie décimale reste permise et le serveur tranche. */
    unit?: string | null;
};

/**
 * Une saisie de quantité qui accepte « 1,5 ».
 *
 * Un `type="number"` rejette la virgule selon la langue du navigateur, et un `parseInt`
 * coupait 1,5 en 1. Le texte tapé est gardé tel quel pendant la frappe (« 1, » n'est pas
 * encore un nombre) ; le parent ne reçoit que des nombres, ou null tant que c'est illisible.
 */
export default function QuantityInput({ value, onChange, unit, ...props }: Props) {
    const [text, setText] = useState(() => toText(value));

    // Une valeur changée de l'extérieur (bouton +, autre ligne) remplace la saisie ; celle
    // qu'on est en train de taper, qui vaut déjà ce nombre, reste intacte. Un champ vidé
    // reste vide : le parent en fait 0, et réafficher « 0 » empêchait d'effacer la quantité.
    useEffect(() => {
        const typed = parseQuantity(text);
        const incoming = parseQuantity(value ?? null);
        if (typed === null && (incoming === null || incoming === 0)) {
            return;
        }
        if (typed !== incoming) {
            setText(toText(value));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const decimal = unit === undefined || isDivisibleUnit(unit);

    return (
        <input
            {...props}
            type="text"
            inputMode={decimal ? 'decimal' : 'numeric'}
            value={text}
            // Au clic, la quantité est sélectionnée : taper la remplace sans l'effacer d'abord.
            onFocus={(e) => {
                e.target.select();
                props.onFocus?.(e);
            }}
            onChange={(e) => {
                const next = sanitize(e.target.value, decimal);
                setText(next);
                onChange(parseQuantity(next));
            }}
        />
    );
}

/**
 * Chiffres seulement, plus un séparateur (« , » ou « . ») quand l'unité se divise : une
 * lettre tapée ou collée est ignorée au lieu de rendre la quantité illisible.
 */
function sanitize(raw: string, decimal: boolean): string {
    const kept = raw.replace(decimal ? /[^0-9.,]/g : /[^0-9]/g, '');
    if (!decimal) {
        return kept;
    }

    const separator = kept.search(/[.,]/);

    return separator === -1
        ? kept
        : kept.slice(0, separator + 1) + kept.slice(separator + 1).replace(/[.,]/g, '');
}

function toText(value: number | string | null | undefined): string {
    const parsed = parseQuantity(value ?? null);

    return parsed === null ? '' : String(parsed).replace('.', ',');
}
