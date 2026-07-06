import type { Locale, Testimonial } from './types';

// ⚠️ PLACEHOLDER TESTIMONIALS — plausible but fictitious quotes/names/stores,
// pending real customer testimonials. Every entry is flagged `isPlaceholder: true`
// so they're trivially greppable/replaceable once real feedback is collected.
export const testimonialsByLocale: Record<Locale, Testimonial[]> = {
    fr: [
        {
            quote: "Avant, je fermais la boutique une heure après tout le monde pour compter la caisse à la main. Maintenant je vois mes ventes du jour depuis mon téléphone, même chez moi.",
            name: 'Moussa Diallo',
            role: 'Gérant',
            location: 'Quincaillerie Diallo & Fils, Dakar',
            isPlaceholder: true,
        },
        {
            quote: 'On gère trois boutiques avec la même équipe qu\'avant, parce qu\'on ne perd plus de temps à chercher où est passé un produit.',
            name: 'Aïcha Koné',
            role: 'Directrice',
            location: 'Koné Matériaux, Abidjan',
            isPlaceholder: true,
        },
        {
            quote: 'Mes vendeurs ne m\'appellent plus dix fois par jour pour un prix ou un niveau de stock. Ils ont tout sous les yeux.',
            name: 'Jean-Baptiste Mballa',
            role: 'Propriétaire',
            location: 'Quincaillerie du Wouri, Douala',
            isPlaceholder: true,
        },
        {
            quote: 'La bascule vers le plan Growth nous a permis de suivre nos trois dépôts sans embaucher un magasinier de plus.',
            name: 'Fatoumata Traoré',
            role: 'Responsable achats',
            location: 'Traoré Quincaillerie, Bamako',
            isPlaceholder: true,
        },
    ],
    en: [
        {
            quote: "I used to close the shop an hour after everyone else just to count the till by hand. Now I see today's sales from my phone, even from home.",
            name: 'Moussa Diallo',
            role: 'Manager',
            location: 'Diallo & Sons Hardware, Dakar',
            isPlaceholder: true,
        },
        {
            quote: "We run three stores with the same team as before, because we no longer waste time hunting for where a product went.",
            name: 'Aïcha Koné',
            role: 'Director',
            location: 'Koné Materials, Abidjan',
            isPlaceholder: true,
        },
        {
            quote: 'My sellers no longer call me ten times a day for a price or a stock level. It\'s all right in front of them.',
            name: 'Jean-Baptiste Mballa',
            role: 'Owner',
            location: 'Wouri Hardware, Douala',
            isPlaceholder: true,
        },
        {
            quote: 'Switching to the Growth plan let us track our three depots without hiring an extra stock clerk.',
            name: 'Fatoumata Traoré',
            role: 'Purchasing manager',
            location: 'Traoré Hardware, Bamako',
            isPlaceholder: true,
        },
    ],
};
