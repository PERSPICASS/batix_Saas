import { motion } from 'framer-motion';

interface WelcomeFooterProps {
    footerText: string;
    nav: { demo: string; features: string; pricing: string; faq: string; contact: string };
}

export default function WelcomeFooter({ footerText, nav }: WelcomeFooterProps) {
    return (
        <motion.footer
            className="mt-0 border-t border-slate-800 bg-slate-900 py-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Main footer content */}
                <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                    <p className="text-sm text-slate-600">© {new Date().getFullYear()} BATIX PRO. {footerText}</p>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                        <a href="#demo" className="text-slate-600 transition hover:text-amber-300">{nav.demo}</a>
                        <a href="#features" className="text-slate-600 transition hover:text-amber-300">{nav.features}</a>
                        <a href="#pricing" className="text-slate-600 transition hover:text-amber-300">{nav.pricing}</a>
                        <a href="#faq" className="text-slate-600 transition hover:text-amber-300">{nav.faq}</a>
                        <a href="#contact" className="text-slate-600 transition hover:text-amber-300">{nav.contact}</a>
                    </div>
                </div>

                {/* Policies links */}
                <div className="mt-8 border-t border-slate-800 pt-8">
                    <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                        <a href="/policies/terms" className="transition hover:text-amber-300">Terms of Service</a>
                        <span className="text-slate-700">•</span>
                        <a href="/policies/privacy" className="transition hover:text-amber-300">Privacy Policy</a>
                        <span className="text-slate-700">•</span>
                        <a href="/policies/refund" className="transition hover:text-amber-300">Refund Policy</a>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
}
