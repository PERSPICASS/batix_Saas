import { motion } from 'framer-motion';
import { common } from '@/i18n/common';
import { useEffect, useState } from 'react';

interface WelcomeFooterProps {
    footerText: string;
    nav?: { demo: string; features: string; pricing: string; faq: string; contact: string };
}

export default function WelcomeFooter({ footerText }: WelcomeFooterProps) {
    const [locale, setLocale] = useState('fr');

    useEffect(() => {
        // Détect locale depuis l'attribut lang du HTML ou le localStorage
        const htmlLang = document.documentElement.lang;
        const storedLocale = localStorage.getItem('locale');
        const detectedLocale = storedLocale || htmlLang || 'fr';
        setLocale(detectedLocale.startsWith('fr') ? 'fr' : 'en');
    }, []);

    const policies = common[locale as keyof typeof common]?.policies || common.fr.policies;

    return (
        <motion.footer
            className="mt-0 border-t border-slate-800 bg-slate-900 py-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-600 md:flex-row lg:px-8">
                <p>© {new Date().getFullYear()} BATIX PRO. {footerText}</p>
                <div className="flex items-center gap-6">
                    <a href="/policies/terms" className="transition hover:text-amber-300">{policies.terms}</a>
                    <span className="text-slate-700">•</span>
                    <a href="/policies/privacy" className="transition hover:text-amber-300">{policies.privacy}</a>
                    <span className="text-slate-700">•</span>
                    <a href="/policies/refund" className="transition hover:text-amber-300">{policies.refund}</a>
                </div>
            </div>
        </motion.footer>
    );
}
