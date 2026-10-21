import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, X } from 'lucide-react';
import type { Locale } from '@/types/types';

/**
 * Bandeau annonçant les 2 mois offerts sur l'abonnement annuel.
 *
 * L'information existait déjà, mais seulement *après* un clic sur « Annuel »
 * dans la grille tarifaire, dont le défaut est « Mensuel » : la majorité des
 * visiteurs ne la voyait jamais.
 *
 * Rendu côté serveur dès le premier octet, volontairement. Un bandeau qui
 * n'apparaît qu'après hydratation pousse toute la page vers le bas une fois
 * l'affichage déjà fait, ce que Google compte en CLS. Le cas symétrique — un
 * visiteur qui l'a masqué et le voit réapparaître le temps d'un éclair — est
 * traité en amont, par le script inline de `app.blade.php` qui pose
 * `data-promo-dismissed` sur <html> avant la première peinture.
 *
 * La fermeture est volontairement stockée en **sessionStorage et non en
 * localStorage** : ce bandeau sert à faire souscrire. Le masquer définitivement
 * au premier clic revenait à perdre le message pour de bon auprès de quelqu'un
 * qui n'était simplement pas prêt ce jour-là. Il s'efface donc pour la visite en
 * cours et revient à la suivante.
 */
export const PROMO_STORAGE_KEY = 'batix_annual_promo_dismissed';

interface Props {
    locale: Locale;
    highlight: string;
    message: string;
    cta: string;
    dismiss: string;
}

export default function AnnualPromoBanner({ locale, highlight, message, cta, dismiss }: Props) {
    const [hidden, setHidden] = useState(false);

    // Le CSS a déjà masqué le bandeau pour qui l'a fermé ; on le retire aussi du
    // DOM après hydratation, pour ne pas laisser un lien invisible dans l'ordre
    // de tabulation ni dans ce que lisent les lecteurs d'écran.
    useEffect(() => {
        if (window.sessionStorage.getItem(PROMO_STORAGE_KEY) === '1') {
            setHidden(true);
        }
    }, []);

    if (hidden) {
        return null;
    }

    const onDismiss = () => {
        window.sessionStorage.setItem(PROMO_STORAGE_KEY, '1');
        document.documentElement.dataset.promoDismissed = '1';
        setHidden(true);
    };

    const pricingHref = locale === 'fr' ? route('pricing') : route('en.pricing');

    return (
        <div data-promo-banner className="relative z-50 bg-terre-600 text-white">
            {/* Toute la zone est cliquable, pas seulement le libellé du lien : celui-ci
                est masqué sous 640 px faute de place, et un bandeau promotionnel sans
                rien de cliquable sur mobile ne mène nulle part. */}
            <Link
                href={pricingHref}
                className="group mx-auto flex max-w-7xl items-center justify-center gap-x-3 gap-y-1 px-12 py-2.5 text-sm sm:px-6 lg:px-8"
            >
                <p className="text-center">
                    <span className="font-bold">{highlight}</span>{' '}
                    <span className="text-terre-100">{message}</span>
                </p>

                <span className="hidden shrink-0 items-center gap-1 font-semibold underline decoration-terre-300 underline-offset-4 transition group-hover:decoration-white sm:inline-flex">
                    {cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
            </Link>

            <button
                type="button"
                onClick={onDismiss}
                aria-label={dismiss}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-terre-100 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
