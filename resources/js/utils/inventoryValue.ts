/**
 * Ce que coûte l'écart constaté par un inventaire.
 *
 * Règle de gestion, décidée le 2026-07-26 : **une pièce défectueuse ne vaut rien.**
 *
 * L'ancien calcul additionnait les deux écarts avant de les valoriser —
 * `(écart bon + écart défectueux) × coût` — ce qui comptait les pièces retrouvées abîmées à
 * leur prix d'achat plein, comme si retrouver une pièce cassée compensait une pièce disparue.
 * Sur un cas réel (189 attendues, 100 bonnes, 8 défectueuses, coût 2 600), il annonçait
 * 210 600 là où la perte est de 231 400 : 20 800 de moins que la réalité.
 *
 * Les deux écarts ne portent d'ailleurs pas sur la même marchandise : `difference` concerne le
 * stock bon, `defectiveDifference` le stock défectueux. Les défectueuses étant valorisées à
 * zéro, leur variation n'a par construction aucun effet sur la valeur — seul l'écart de stock
 * bon compte, qu'il s'agisse d'unités disparues ou d'unités passées à l'état défectueux.
 */
export function inventoryDiscrepancyValue(difference: number, unitCost: number): number {
    return difference * unitCost;
}

/**
 * La valeur totale d'un inventaire, écarts positifs et négatifs confondus.
 *
 * Un excédent réduit donc la perte affichée, ce qui est voulu : le nombre répond à « combien
 * cet inventaire a-t-il coûté », pas « combien de choses ne collent pas ».
 */
export function inventoryTotalValue(
    items: ReadonlyArray<{ difference: number; unit_cost: number }>,
): number {
    return items.reduce((sum, item) => sum + inventoryDiscrepancyValue(item.difference, item.unit_cost), 0);
}
