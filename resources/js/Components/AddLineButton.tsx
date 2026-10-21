import { Plus } from 'lucide-react';

/**
 * Bouton « ajouter une ligne » placé sous la liste des lignes d'un document.
 * Le bouton d'en-tête seul obligeait à remonter tout le formulaire, surtout sur
 * mobile où chaque ligne occupe un écran entier.
 */
export default function AddLineButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2.5 text-sm text-slate-600 transition hover:border-amber-300/60 hover:bg-amber-300/5 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:text-white"
        >
            <Plus className="size-4" />
            {label}
        </button>
    );
}
