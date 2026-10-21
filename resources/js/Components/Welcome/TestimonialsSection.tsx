import { motion } from 'framer-motion';
import { Star, Quote, ThumbsUp } from 'lucide-react';
import { fadeUp, stagger } from '../../types/data';
import type { Locale } from '../../types/types';

export interface Testimonial {
    id: number;
    author_name: string;
    author_company: string | null;
    rating: number;
    comment: string;
    would_recommend: boolean;
}

interface TestimonialsSectionProps {
    locale: Locale;
    reviews: Testimonial[];
}

/**
 * Real, admin-approved customer reviews. Renders nothing when there are none —
 * the section must never fall back to invented testimonials (the fabricated ones
 * were deliberately removed from the site).
 */
export default function TestimonialsSection({ locale, reviews }: TestimonialsSectionProps) {
    if (!reviews || reviews.length === 0) return null;

    const isFr = locale === 'fr';

    return (
        <motion.section
            id="testimonials"
            className="w-full scroll-mt-24 bg-gray-50 py-14 md:py-20"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.1 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <motion.div className="mb-10" variants={fadeUp}>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-600">
                        {isFr ? 'Ils nous font confiance' : 'Trusted by our customers'}
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                        {isFr ? 'Ce que disent nos clients' : 'What our customers say'}
                    </h2>
                    <div className="mt-3 h-1 w-12 rounded-full bg-terre-500" />
                </motion.div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((r) => (
                        <motion.figure
                            key={r.id}
                            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                            variants={fadeUp}
                            whileHover={{ y: -4 }}
                        >
                            <Quote className="size-7 text-terre-300" />
                            <div className="mt-3 flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <Star key={n} className={`size-4 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <blockquote className="mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                                {r.comment}
                            </blockquote>
                            <figcaption className="mt-4 border-t border-gray-100 pt-4">
                                <p className="font-semibold text-slate-900">{r.author_name}</p>
                                {r.author_company && (
                                    <p className="text-sm text-slate-500">{r.author_company}</p>
                                )}
                                {r.would_recommend && (
                                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        <ThumbsUp className="size-3.5" />
                                        {isFr ? 'Recommande BATIX PRO' : 'Recommends BATIX PRO'}
                                    </span>
                                )}
                            </figcaption>
                        </motion.figure>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
