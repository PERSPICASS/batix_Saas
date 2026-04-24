import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import contactBackground from '/resources/images/smiling-worker-holding-mallet-in-hardware-store-ai-2026-01-06-18-15-56-utc.jpg';

interface ContactSectionProps {
    t: {
        contact: { title: string; description: string; cta: string };
    };
    getDashboardUrl: () => string;
}

export default function ContactSection({ t, getDashboardUrl }: ContactSectionProps) {
    return (
        <motion.section
            id="contact"
            className="w-full scroll-mt-24 bg-[#f5efe4] bg-cover bg-center py-10 md:py-14"
            style={{ backgroundImage: `linear-gradient(120deg, rgba(15, 23, 42, 0.76), rgba(51, 65, 85, 0.58)), url(${contactBackground})` }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="rounded-3xl bg-black/20 p-10 text-center shadow-xl backdrop-blur-[2px]">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{t.contact.title}</h2>
                    <p className="mx-auto mt-3 max-w-2xl text-slate-100">{t.contact.description}</p>
                    <Link
                        href={getDashboardUrl()}
                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-7 py-4 font-bold text-slate-900 shadow-md transition hover:bg-amber-200 hover:shadow-lg"
                    >
                        {t.contact.cta}
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </motion.section>
    );
}
