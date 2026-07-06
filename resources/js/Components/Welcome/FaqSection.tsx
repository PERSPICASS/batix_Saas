import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, CircleHelp } from 'lucide-react';
import { useState } from 'react';
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
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (index: number) => {
        setOpenIndex((current) => (current === index ? null : index));
    };

    return (
        <motion.section
            id="faq"
            key={`faq-${locale}`}
            className="w-full scroll-mt-24 bg-white py-10 md:py-14"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
                <div className="rounded-3xl  p-6 lg:p-8">
                    <div className="mb-2 flex items-center gap-2">
                        <CircleHelp className="size-5 text-terre-600" />
                        <h2 className="text-3xl font-extrabold text-slate-900">{faqTitle}</h2>
                    </div>
                    <div className="mb-8 h-1 w-12 rounded-full bg-terre-500" />
                    <div className="space-y-3">
                        {faqs.map((faq, index) => {
                            const isOpen = openIndex === index;
                            return (
                                <motion.div
                                    key={faq.question}
                                    variants={fadeUp}
                                    className={`overflow-hidden rounded-2xl border transition-colors ${
                                        isOpen ? 'border-terre-300 bg-white' : 'border-gray-200 bg-white hover:border-terre-200'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggle(index)}
                                        aria-expanded={isOpen}
                                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                                    >
                                        <span className="font-bold text-slate-900">{faq.question}</span>
                                        <ChevronDown
                                            className={`size-4 shrink-0 text-terre-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500">{faq.answer}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
