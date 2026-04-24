import { motion } from 'framer-motion';

interface WelcomeFooterProps {
    footerText: string;
    nav: { demo: string; features: string; pricing: string; faq: string; contact: string };
}

export default function WelcomeFooter({ footerText, nav }: WelcomeFooterProps) {
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
                <div className="flex items-center gap-4">
                    <a href="#demo" className="transition hover:text-slate-900">{nav.demo}</a>
                    <a href="#features" className="transition hover:text-slate-900">{nav.features}</a>
                    <a href="#pricing" className="transition hover:text-slate-900">{nav.pricing}</a>
                    <a href="#faq" className="transition hover:text-slate-900">{nav.faq}</a>
                    <a href="#contact" className="transition hover:text-slate-900">{nav.contact}</a>
                </div>
            </div>
        </motion.footer>
    );
}
