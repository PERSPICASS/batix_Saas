import { describe, expect, it } from 'vitest';
import { inventoryDiscrepancyValue, inventoryTotalValue } from '../utils/inventoryValue';

describe('inventoryDiscrepancyValue', () => {
    it('valorise un manque au coût unitaire', () => {
        expect(inventoryDiscrepancyValue(-89, 2600)).toBe(-231400);
    });

    it('ne compte pas les pièces défectueuses comme une compensation', () => {
        // Le cas réel qui a motivé la règle : 189 attendues, 100 bonnes, 8 défectueuses.
        // L'ancien calcul nettait le +8 et annonçait 210 600 — soit 20 800 de moins que la perte.
        const ancienCalcul = (-89 + 8) * 2600;

        expect(ancienCalcul).toBe(-210600);
        expect(inventoryDiscrepancyValue(-89, 2600)).toBe(-231400);
        expect(inventoryDiscrepancyValue(-89, 2600)).toBeLessThan(ancienCalcul);
    });

    it('valorise à zéro des pièces passées de bonnes à défectueuses', () => {
        // 8 unités abîmées : le stock bon perd 8, le défectueux en gagne 8. La perte est réelle
        // et vaut 8 unités, puisqu'une défectueuse ne vaut rien.
        expect(inventoryDiscrepancyValue(-8, 2600)).toBe(-20800);
    });

    it('ne valorise rien quand seul le défectueux bouge', () => {
        // Des défectueuses mises au rebut ne coûtent rien de plus : elles valaient déjà zéro.
        expect(inventoryDiscrepancyValue(0, 2600)).toBe(0);
    });

    it('valorise un excédent positivement', () => {
        expect(inventoryDiscrepancyValue(5, 1000)).toBe(5000);
    });

    it('rend zéro sans écart', () => {
        expect(inventoryDiscrepancyValue(0, 50900)).toBe(0);
    });
});

describe('inventoryTotalValue', () => {
    it('somme les lignes en conservant les signes', () => {
        const items = [
            { difference: 0, unit_cost: 50900 },
            { difference: -89, unit_cost: 2600 },
        ];

        expect(inventoryTotalValue(items)).toBe(-231400);
    });

    it('un excédent compense un manque', () => {
        const items = [
            { difference: -10, unit_cost: 1000 },
            { difference: 4, unit_cost: 1000 },
        ];

        expect(inventoryTotalValue(items)).toBe(-6000);
    });

    it('rend zéro sur un inventaire sans écart', () => {
        expect(inventoryTotalValue([{ difference: 0, unit_cost: 2600 }])).toBe(0);
    });

    it('rend zéro sans ligne', () => {
        expect(inventoryTotalValue([])).toBe(0);
    });
});
