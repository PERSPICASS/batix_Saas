import { Link } from '@inertiajs/react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** Liens de pagination d'un paginator Laravel (masqués s'il n'y a qu'une page). */
export default function PaginationLinks({ links }: { links?: PaginationLink[] }) {
    if (!links || links.length <= 3) return null;

    return (
        <nav className="flex flex-wrap items-center justify-center gap-1">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={index}
                        href={link.url}
                        preserveScroll
                        className={`rounded-lg px-3 py-2 text-sm ${
                            link.active
                                ? 'bg-amber-300 font-semibold text-slate-950'
                                : 'border border-gray-300 text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={index}
                        className="cursor-not-allowed rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-400 opacity-50 dark:border-white/10"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}
