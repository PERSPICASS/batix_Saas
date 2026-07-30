import { ImgHTMLAttributes } from 'react';

/** Bloc-marque officiel, genere depuis public/logo.png. */
const LOGO_LIGHT = '/images/logo-batixpro.png';
/** Meme bloc-marque, bleu nuit repasse en blanc : invisible autrement sur fond sombre. */
const LOGO_DARK = '/images/logo-batixpro-dark.png';

/** Dimensions intrinseques du fichier, pour reserver la place avant chargement. */
const LOGO_WIDTH = 790;
const LOGO_HEIGHT = 334;

interface ApplicationLogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
    /** 'auto' suit le mode sombre ; 'light'/'dark' forcent la variante. */
    theme?: 'auto' | 'light' | 'dark';
}

export default function ApplicationLogo({
    theme = 'auto',
    className = 'h-9 w-auto',
    ...props
}: ApplicationLogoProps) {
    const common = { width: LOGO_WIDTH, height: LOGO_HEIGHT, ...props };

    // `self-start` n'est pas cosmétique : dans un parent `flex-col`, l'item est
    // étiré sur l'axe transversal (la largeur), ce qui écrase `w-auto` et aplatit
    // le bloc-marque sur la hauteur imposée. On neutralise l'étirement ici pour
    // que le ratio tienne quel que soit le conteneur d'appel.
    const base = `${className} self-start`;

    if (theme !== 'auto') {
        return (
            <img
                src={theme === 'dark' ? LOGO_DARK : LOGO_LIGHT}
                alt="BATIX PRO"
                className={base}
                {...common}
            />
        );
    }

    // Les deux variantes sont dans le DOM et c'est la classe `dark` qui tranche :
    // choisir en JS provoquerait un flash de la mauvaise version au premier rendu.
    return (
        <>
            <img src={LOGO_LIGHT} alt="BATIX PRO" className={`${base} dark:hidden`} {...common} />
            <img
                src={LOGO_DARK}
                alt=""
                aria-hidden="true"
                className={`hidden ${base} dark:block`}
                {...common}
            />
        </>
    );
}
