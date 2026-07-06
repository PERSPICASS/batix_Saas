import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import contactBackground from '/resources/images/smiling-worker-holding-mallet-in-hardware-store-ai-2026-01-06-18-15-56-utc.jpg';

interface FinalCtaSectionProps {
    title: string;
    description: string;
    cta: string;
    getDashboardUrl: () => string;
}

/** Closing CTA banner, shared between the Home page and the bottom of ContactSection. */
export default function FinalCtaSection({ title, description, cta, getDashboardUrl }: FinalCtaSectionProps) {
    return (
        <motion.div
            className="w-full bg-cover bg-center py-10 md:py-14"
            style={{ backgroundImage: `linear-gradient(120deg, rgba(60, 32, 17, 0.82), rgba(160, 82, 45, 0.55)), url(${contactBackground})` }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="rounded-3xl bg-black/20 p-10 text-center shadow-xl backdrop-blur-[2px]">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
                    <p className="mx-auto mt-3 max-w-2xl text-slate-100">{description}</p>
                    <a
                        href={getDashboardUrl()}
                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-7 py-4 font-bold text-slate-900 shadow-md transition hover:bg-amber-400 hover:shadow-lg"
                    >
                        {cta}
                        <ArrowRight className="size-4" />
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
