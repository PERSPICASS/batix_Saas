import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import type { Locale } from '@/types/types';
import { copy } from '@/types/data';
import { featurePages } from '@/types/featurePages';

interface WelcomeFooterProps {
    locale: Locale;
    footerText: string;
}

export default function WelcomeFooter({ locale, footerText }: WelcomeFooterProps) {
    const isFr = locale === 'fr';
    const t = copy[locale];
    const policies = t.policies;

    const productLinks = [
        { label: isFr ? 'Toutes les fonctionnalités' : 'All features', href: isFr ? route('features.index') : route('en.features.index') },
        ...featurePages.map((page) => ({
            label: page.title[locale],
            href: isFr ? route('features.show', page.slug) : route('en.features.show', page.slug),
        })),
        { label: t.nav.pricing, href: isFr ? route('pricing') : route('en.pricing') },
    ];

    const companyLinks = [
        { label: isFr ? 'À propos' : 'About', href: isFr ? route('about') : route('en.about') },
       // { label: isFr ? 'Ressources' : 'Resources', href: isFr ? route('resources') : route('en.resources') },
        { label: isFr ? 'Blog' : 'Blog', href: isFr ? route('blog.index') : route('en.blog.index') },
        { label: 'Contact', href: isFr ? route('contact.show') : route('en.contact.show') },
    ];

    const legalLinks = [
        { label: policies.terms, href: isFr ? route('policies.show', 'terms') : route('en.policies.show', 'terms') },
        { label: policies.privacy, href: isFr ? route('policies.show', 'privacy') : route('en.policies.show', 'privacy') },
        { label: policies.refund, href: isFr ? route('policies.show', 'refund') : route('en.policies.show', 'refund') },
        { label: isFr ? 'Sécurité' : 'Security', href: isFr ? route('security') : route('en.security') },
        { label: isFr ? 'Sous-traitants' : 'Subprocessors', href: isFr ? route('subprocessors') : route('en.subprocessors') },
        { label: isFr ? 'Fiabilité' : 'Reliability', href: isFr ? route('reliability') : route('en.reliability') },
    ];

    return (
        <motion.footer
            className="mt-0 border-t border-gray-200 bg-white pt-14"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Marque */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <ApplicationLogo theme="light" className="h-9 w-auto" />
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">{footerText}</p>
                        <div className="mt-5 flex flex-col gap-2 text-sm">
                            <a href="mailto:contact@batixpro.com" className="inline-flex items-center gap-2 text-slate-600 transition hover:text-terre-700">
                                <Mail className="size-4" />
                                contact@batixpro.com
                            </a>
                            <a
                                href="https://wa.me/2250565759428"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-slate-600 transition hover:text-terre-700"
                            >
                                <MessageCircle className="size-4" />
                                WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Produit */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            {isFr ? 'Produit' : 'Product'}
                        </p>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {productLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-slate-600 transition hover:text-terre-700">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Entreprise */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            {isFr ? 'Entreprise' : 'Company'}
                        </p>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {companyLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-slate-600 transition hover:text-terre-700">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Légal */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            {isFr ? 'Légal' : 'Legal'}
                        </p>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {legalLinks.map((link) => (
                                <li key={link.href}>
                                    <a href={link.href} className="text-slate-600 transition hover:text-terre-700">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 py-6 text-center text-xs text-slate-400">
                    © {new Date().getFullYear()} BATIX PRO. {isFr ? 'Tous droits réservés.' : 'All rights reserved.'}
                </div>
            </div>
        </motion.footer>
    );
}
