import { useLocale } from '@/contexts/LocaleContext';

export interface CompletionPreviewRow {
    id: number | string;
    productName: string;
    goodBefore: number;
    goodAfter: number;
    goodChanged: boolean;
    defectiveBefore: number;
    defectiveAfter: number;
    defectiveChanged: boolean;
}

export default function InventoryCompletionPreview({ rows }: { rows: CompletionPreviewRow[] }) {
    const { t } = useLocale();

    if (rows.length === 0) {
        return <p className="mt-4 text-sm text-slate-400">{t.inventory.completeModal.noChanges}</p>;
    }

    return (
        <>
            <p className="mt-3 text-xs font-medium text-amber-300">
                {t.inventory.completeModal.itemsAffected(rows.length)}
            </p>
            <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-900">
                        <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                            <th className="px-3 py-2">{t.inventory.form.product}</th>
                            <th className="px-3 py-2 text-right">{t.inventory.completeModal.colGood}</th>
                            <th className="px-3 py-2 text-right">{t.inventory.completeModal.colDefective}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td className="px-3 py-2 text-white">{row.productName}</td>
                                <td className={`px-3 py-2 text-right ${row.goodChanged ? (row.goodAfter > row.goodBefore ? 'text-green-300' : 'text-red-300') : 'text-slate-500'}`}>
                                    {row.goodChanged ? `${row.goodBefore} → ${row.goodAfter}` : '—'}
                                </td>
                                <td className={`px-3 py-2 text-right ${row.defectiveChanged ? (row.defectiveAfter > row.defectiveBefore ? 'text-green-300' : 'text-red-300') : 'text-slate-500'}`}>
                                    {row.defectiveChanged ? `${row.defectiveBefore} → ${row.defectiveAfter}` : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
