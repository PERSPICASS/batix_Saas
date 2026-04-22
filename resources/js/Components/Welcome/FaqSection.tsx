import { motion } from 'framer-motion';
import { CircleHelp } from 'lucide-react';
import { fadeUp, stagger } from '../../types/data';
import type { Locale } from '../../types/types';

interface FaqItem {
    question: string;
    answer: string;
}

interface FaqSectionProps {
    locale: Locale;
    faqTitle: string;
    faqs: FaqItem[];
}

export default function FaqSection({ locale, faqTitle, faqs }: FaqSectionProps) {
    return (
        <motion.section
            id="faq"
            key={`faq-${locale}`}
            className="w-full scroll-mt-24 bg-[#f2ebe0] py-10 md:py-14"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="rounded-3xl border border-[#dfd3bf] bg-white p-6 shadow-sm lg:p-8">
                    <div className="mb-2 flex items-center gap-2">
                        <CircleHelp className="size-5 text-amber-600" />
                        <h2 className="text-3xl font-extrabold text-slate-900">{faqTitle}</h2>
                    </div>
                    <div className="mb-8 h-1 w-12 rounded-full bg-amber-400" />
                    <div className="grid gap-3 md:grid-cols-2">
                        {faqs.map((faq) => (
                            <motion.article key={faq.question} className="rounded-2xl border border-[#e8dfd1] bg-[#fdf9f4] p-5 shadow-sm" variants={fadeUp}>
                                <h3 className="font-bold text-slate-900">{faq.question}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
