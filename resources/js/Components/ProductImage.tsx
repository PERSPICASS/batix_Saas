import { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ProductImageProps {
    /** Chemin relatif stocké en base, ex: "products/abc.jpg" */
    src: string | null;
    /** Nom du produit — utilisé pour l'alt ET le fallback initiale */
    name: string;
    /** Taille de la miniature (classes Tailwind). Défaut : "size-10" */
    thumbnailClass?: string;
    /** Classes additionnelles sur le conteneur */
    className?: string;
}

/**
 * Miniature produit cliquable avec zoom en lightbox.
 * Affiche la première lettre du nom si pas d'image.
 */
export default function ProductImage({
    src,
    name,
    thumbnailClass = 'size-10',
    className = '',
}: ProductImageProps) {
    const [open, setOpen] = useState(false);

    // Fermer avec Échap
    const onKey = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
    }, []);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', onKey);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onKey]);

    const initial = name.charAt(0).toUpperCase();

    return (
        <>
            {/* Miniature */}
            {src ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={`group relative shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400 ${thumbnailClass} ${className}`}
                    title="Agrandir l'image"
                >
                    <img
                        src={`/storage/${src}`}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
                        <ZoomIn className="size-3.5 text-white opacity-0 drop-shadow transition-opacity duration-200 group-hover:opacity-100" />
                    </span>
                </button>
            ) : (
                <div
                    className={`shrink-0 rounded-lg bg-slate-800 ring-1 ring-white/10 flex items-center justify-center ${thumbnailClass} ${className}`}
                >
                    <span className="font-bold text-slate-600 uppercase leading-none"
                        style={{ fontSize: 'clamp(10px, 40%, 18px)' }}>
                        {initial}
                    </span>
                </div>
            )}

            {/* Lightbox */}
            {open && src && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="relative max-h-[90vh] max-w-[90vw]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={`/storage/${src}`}
                            alt={name}
                            className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
                        />
                        <p className="mt-3 text-center text-sm font-medium text-slate-300">
                            {name}
                        </p>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-slate-700 text-white ring-1 ring-white/20 hover:bg-slate-600 transition-colors"
                            title="Fermer (Échap)"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
