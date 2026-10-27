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
    // qu'on est en train de taper, qui vaut déjà ce nombre, reste intacte.
    useEffect(() => {
        if (parseQuantity(text) !== parseQuantity(value ?? null)) {
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
            onChange={(e) => {
                const next = decimal ? e.target.value : e.target.value.replace(/[.,]/g, '');
                setText(next);
                onChange(parseQuantity(next));
            }}
        />
    );
}

function toText(value: number | string | null | undefined): string {
    const parsed = parseQuantity(value ?? null);

    return parsed === null ? '' : String(parsed).replace('.', ',');
}
