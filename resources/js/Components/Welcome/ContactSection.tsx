import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Mail, MessageCircle, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import contactBackground from '/resources/images/smiling-worker-holding-mallet-in-hardware-store-ai-2026-01-06-18-15-56-utc.jpg';
import { fadeUp, stagger } from '../../types/data';
import type { Locale } from '../../types/types';

interface ContactForm {
    heading: string;
    subheading: string;
    name: string;
    email: string;
    subject: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    successTitle: string;
    successText: string;
    errorText: string;
    contactInfo: string;
}

interface ContactSectionProps {
    locale: Locale;
    t: {
        contact: {
            title: string;
            description: string;
            cta: string;
            form: ContactForm;
        };
    };
    getDashboardUrl: () => string;
}

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ContactSection({ locale, t, getDashboardUrl }: ContactSectionProps) {
    const f = t.contact.form;
    const pageProps = usePage().props as unknown as { csrf_token?: string; whatsapp_number?: string };
    const csrfToken =
        pageProps.csrf_token ??
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ??
        '';
    const whatsappNumber = pageProps.whatsapp_number ?? '+2250565759428';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const honeypotRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status === 'sending') return;

        setStatus('sending');
        setErrorMsg('');
        setFieldErrors({});

        try {
            const res = await fetch('/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    subject,
                    message,
                    honeypot: honeypotRef.current?.value ?? '',
                }),
            });
            const data = await res.json();

            if (res.status === 422 && data?.errors) {
                // Erreurs de validation par champ
                const flat: Record<string, string> = {};
                for (const [field, msgs] of Object.entries(data.errors as Record<string, string[]>)) {
                    flat[field] = msgs[0];
                }
                setFieldErrors(flat);
                setStatus('idle');
                return;
            }

            if (!res.ok) throw new Error(data?.message ?? f.errorText);

            setStatus('success');
            setName('');
            setEmail('');
            setSubject('');
            setMessage('');
        } catch (err: unknown) {
            setStatus('error');
            setErrorMsg(err instanceof Error ? err.message : f.errorText);
        }
    };

    return (
        <section id="contact" className="w-full scroll-mt-24 bg-[#f5efe4]">

            {/* ── Bloc formulaire ────────────────────────────────────────── */}
            <motion.div
                className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24"
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.08 }}
                variants={stagger}
            >
                {/* Carte principale : colonne dark + colonne formulaire */}
                <div className="overflow-hidden rounded-3xl shadow-2xl lg:grid lg:grid-cols-5">

                    {/* ── Colonne gauche dark ─────────────────────────────── */}
                    <motion.div
                        variants={fadeUp}
                        className="flex flex-col justify-between bg-slate-900 px-8 py-12 lg:col-span-2 lg:px-10 lg:py-14"
                    >
                        <div>
                            <span className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
                                Contact
                            </span>
                            <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white lg:text-4xl">
                                {f.heading.split('?')[0]}?<br />
                                {f.heading.split('?')[1]?.trim()}
                            </h2>
                            <p className="mt-3 text-base text-slate-400">{f.subheading}</p>
                            <div className="mt-5 h-px w-12 rounded-full bg-amber-400" />
                        </div>

                        <div className="mt-12 flex flex-col gap-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                {f.contactInfo}
                            </p>
                            <a
                                href="mailto:contact@batixpro.com"
                                className="group inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-white"
                            >
                                <span className="inline-flex shrink-0 rounded-xl bg-amber-400/15 p-2.5 text-amber-400 transition group-hover:bg-amber-400/25">
                                    <Mail className="size-4" />
                                </span>
                                contact@batixpro.com
                            </a>
                            <a
                                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-slate-200 transition hover:border-green-400/40 hover:bg-green-400/10 hover:text-white"
                            >
                                <span className="inline-flex shrink-0 rounded-xl bg-green-400/15 p-2.5 text-green-400 transition group-hover:bg-green-400/25">
                                    <MessageCircle className="size-4" />
                                </span>
                                WhatsApp
                            </a>
                        </div>
                    </motion.div>

                    {/* ── Colonne droite formulaire ────────────────────────── */}
                    <motion.div
                        variants={fadeUp}
                        className="bg-white px-8 py-12 lg:col-span-3 lg:px-12 lg:py-14"
                    >
                        {status === 'success' ? (
                            <div className="flex h-full flex-col items-center justify-center gap-5 py-10 text-center">
                                <div className="flex size-20 items-center justify-center rounded-full bg-emerald-50">
                                    <CheckCircle2 className="size-10 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-extrabold text-slate-900">{f.successTitle}</h3>
                                    <p className="mt-2 text-slate-500">{f.successText}</p>
                                </div>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className="mt-2 rounded-xl border border-[#ddd0bb] px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-amber-400 hover:text-amber-700"
                                >
                                    {locale === 'fr' ? 'Envoyer un autre message' : 'Send another message'}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                                {/* Honeypot anti-spam */}
                                <input ref={honeypotRef} type="text" name="honeypot" tabIndex={-1} aria-hidden="true" className="hidden" autoComplete="off" />

                                {/* Nom + Email côte à côte */}
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {f.name} <span className="text-amber-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: '' })); }}
                                            required
                                            minLength={2}
                                            className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-400/20 ${fieldErrors.name ? 'border-red-400 bg-red-50 focus:border-red-400' : 'border-[#ddd0bb] bg-[#fdf9f4] focus:border-amber-400'}`}
                                            placeholder="Jean Dupont"
                                        />
                                        {fieldErrors.name && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500"><span>⚠</span>{fieldErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {f.email} <span className="text-amber-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                                            required
                                            className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-400/20 ${fieldErrors.email ? 'border-red-400 bg-red-50 focus:border-red-400' : 'border-[#ddd0bb] bg-[#fdf9f4] focus:border-amber-400'}`}
                                            placeholder="jean@exemple.com"
                                        />
                                        {fieldErrors.email && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500"><span>⚠</span>{fieldErrors.email}</p>}
                                    </div>
                                </div>

                                {/* Sujet */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {f.subject} <span className="text-amber-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => { setSubject(e.target.value); setFieldErrors((p) => ({ ...p, subject: '' })); }}
                                        required
                                        minLength={3}
                                        className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-400/20 ${fieldErrors.subject ? 'border-red-400 bg-red-50 focus:border-red-400' : 'border-[#ddd0bb] bg-[#fdf9f4] focus:border-amber-400'}`}
                                        placeholder={f.subjectPlaceholder}
                                    />
                                    {fieldErrors.subject && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500"><span>⚠</span>{fieldErrors.subject}</p>}
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Message <span className="text-amber-500">*</span>
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => { setMessage(e.target.value); setFieldErrors((p) => ({ ...p, message: '' })); }}
                                        required
                                        minLength={10}
                                        rows={5}
                                        className={`w-full resize-none rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-400/20 ${fieldErrors.message ? 'border-red-400 bg-red-50 focus:border-red-400' : 'border-[#ddd0bb] bg-[#fdf9f4] focus:border-amber-400'}`}
                                        placeholder={f.messagePlaceholder}
                                    />
                                    {fieldErrors.message && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500"><span>⚠</span>{fieldErrors.message}</p>}
                                </div>

                                {status === 'error' && (
                                    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                        ⚠ {errorMsg || f.errorText}
                                    </p>
                                )}

                                <div className="flex items-center justify-between gap-4 pt-1">
                                    <p className="text-xs text-slate-400">
                                        {locale === 'fr' ? 'Réponse sous 24h garantie' : 'Reply within 24h guaranteed'}
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={status === 'sending'}
                                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-7 py-3.5 font-bold text-slate-900 shadow-md transition hover:bg-amber-300 hover:shadow-lg active:scale-95 disabled:opacity-60"
                                    >
                                        {status === 'sending' ? (
                                            <>
                                                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                {f.sending}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="size-4" />
                                                {f.submit}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            </motion.div>

            {/* ── CTA bandeau photo ───────────────────────────────────────── */}
            <motion.div
                className="w-full bg-cover bg-center py-10 md:py-14"
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
                        <a
                            href={getDashboardUrl()}
                            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-7 py-4 font-bold text-slate-900 shadow-md transition hover:bg-amber-200 hover:shadow-lg"
                        >
                            {t.contact.cta}
                            <ArrowRight className="size-4" />
                        </a>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
