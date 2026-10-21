import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Star, MessageSquareHeart, CheckCircle2, Clock, X } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

export interface MyReview {
    rating: number;
    comment: string;
    would_recommend: boolean;
    status: 'pending' | 'approved' | 'rejected';
}

interface ReviewModalProps {
    show: boolean;
    onClose: () => void;
    review: MyReview | null;
}

export default function ReviewModal({ show, onClose, review }: ReviewModalProps) {
    const route = useRoute();
    const { locale } = useLocale();
    const isFr = locale === 'fr';

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        rating: review?.rating ?? 0,
        comment: review?.comment ?? '',
        would_recommend: review?.would_recommend ?? true,
    });

    const [hover, setHover] = useState(0);

    // Re-sync the form when the modal is (re)opened, so it reflects the latest
    // saved review after a submit.
    useEffect(() => {
        if (show) {
            setData({
                rating: review?.rating ?? 0,
                comment: review?.comment ?? '',
                would_recommend: review?.would_recommend ?? true,
            });
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('reviews.store'), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="bg-white p-6 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <MessageSquareHeart className="size-6 text-amber-400" />
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {isFr ? 'Donner mon avis' : 'Leave a review'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isFr ? 'Votre retour peut être publié comme témoignage.' : 'Your feedback may be published as a testimonial.'}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                        <X className="size-5" />
                    </button>
                </div>

                {review?.status === 'approved' && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-4 shrink-0" />
                        {isFr ? 'Votre avis est publié. Merci !' : 'Your review is published. Thank you!'}
                    </div>
                )}
                {review?.status === 'pending' && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                        <Clock className="size-4 shrink-0" />
                        {isFr ? 'Votre avis est en attente de validation.' : 'Your review is awaiting approval.'}
                    </div>
                )}

                <form onSubmit={submit} className="mt-5 space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {isFr ? 'Votre note' : 'Your rating'}
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setData('rating', n)}
                                    onMouseEnter={() => setHover(n)}
                                    onMouseLeave={() => setHover(0)}
                                    aria-label={`${n} / 5`}
                                    className="p-1"
                                >
                                    <Star className={`size-8 transition ${n <= (hover || data.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.rating} className="mt-1" />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {isFr ? 'Votre avis' : 'Your review'}
                        </label>
                        <textarea
                            rows={4}
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            placeholder={isFr ? 'Qu’avez-vous pensé de BATIX PRO ?' : 'What did you think of BATIX PRO?'}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-800 dark:text-white focus:border-amber-300 focus:outline-none"
                        />
                        <InputError message={errors.comment} className="mt-1" />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {isFr ? 'Recommanderiez-vous BATIX PRO ?' : 'Would you recommend BATIX PRO?'}
                        </label>
                        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-800">
                            {[
                                { value: true, label: isFr ? 'Oui' : 'Yes' },
                                { value: false, label: isFr ? 'Non' : 'No' },
                            ].map((opt) => (
                                <button
                                    key={String(opt.value)}
                                    type="button"
                                    onClick={() => setData('would_recommend', opt.value)}
                                    className={`rounded-lg px-5 py-1.5 text-sm font-semibold transition ${
                                        data.would_recommend === opt.value
                                            ? 'bg-amber-300 text-slate-950'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
                            {isFr ? 'Annuler' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={processing} className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                            {review
                                ? (isFr ? 'Mettre à jour' : 'Update')
                                : (isFr ? 'Envoyer' : 'Send')}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
