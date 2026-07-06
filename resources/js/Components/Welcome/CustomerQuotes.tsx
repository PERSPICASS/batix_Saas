import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Quote } from 'lucide-react';
import { fadeUp, stagger } from '../../types/data';
import type { Locale, Testimonial } from '../../types/types';

interface CustomerQuotesProps {
    locale: Locale;
    testimonials: Testimonial[];
    viewAllHref?: string;
}

export default function CustomerQuotes({ locale, testimonials, viewAllHref }: CustomerQuotesProps) {
    return (
        <motion.section
            className="w-full bg-gray-50 py-14 md:py-20"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <motion.div className="mb-10 max-w-2xl" variants={fadeUp}>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">
                        {locale === 'fr' ? 'Témoignages' : 'Testimonials'}
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                        {locale === 'fr' ? 'Ce que nos clients en disent' : 'What our customers say'}
                    </h2>
                </motion.div>

                <div className="grid gap-5 sm:grid-cols-2">
                    {testimonials.map((testimonial) => (
                        <motion.figure
                            key={testimonial.name}
                            variants={fadeUp}
                            className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <Quote className="mb-4 size-6 text-terre-500" />
                            <blockquote className="flex-1 text-base leading-relaxed text-slate-700">
                                “{testimonial.quote}”
                            </blockquote>
                            <figcaption className="mt-5 border-t border-gray-100 pt-4">
                                <p className="font-bold text-slate-900">{testimonial.name}</p>
                                <p className="text-sm text-slate-500">{testimonial.role} — {testimonial.location}</p>
                            </figcaption>
                        </motion.figure>
                    ))}
                </div>

                {viewAllHref && (
                    <motion.div className="mt-8 text-center" variants={fadeUp}>
                        <Link
                            href={viewAllHref}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-terre-700 transition hover:text-terre-900"
                        >
                            {locale === 'fr' ? 'Voir tous les témoignages' : 'See all testimonials'}
                            <ArrowRight className="size-4" />
                        </Link>
                    </motion.div>
                )}
            </div>
        </motion.section>
    );
}
