import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { CheckCircle2, Clock, ArrowRight, Mail } from 'lucide-react';

interface Props extends PageProps {
    planName: string;
    message: string | null;
}

export default function Confirmation({ planName, message, auth }: Props) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-white">Confirmation</h2>}>
            <Head title="Paiement soumis" />

            <div className="mx-auto max-w-lg">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center space-y-6">

                    {/* Icône */}
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-300/20">
                        <CheckCircle2 className="size-9 text-amber-300" />
                    </div>

                    {/* Titre */}
                    <div>
                        <h1 className="text-2xl font-bold text-white">Demande enregistrée !</h1>
                        <p className="mt-2 text-slate-400">
                            Votre demande d'abonnement au plan <strong className="text-white">{planName}</strong> a bien été reçue.
                        </p>
                    </div>

                    {/* Étapes */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-left space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-amber-200">Prochaines étapes</p>

                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-xs font-bold text-amber-300">1</div>
                            <div>
                                <p className="text-sm font-medium text-white">Effectuez le paiement</p>
                                <p className="text-xs text-slate-400">Envoyez le montant via le mode de paiement choisi avec la référence indiquée.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-xs font-bold text-amber-300">2</div>
                            <div>
                                <p className="text-sm font-medium text-white">Vérification sous 24h</p>
                                <p className="text-xs text-slate-400">Notre équipe vérifie votre paiement et active votre abonnement.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-400">3</div>
                            <div>
                                <p className="text-sm font-medium text-white">Abonnement activé</p>
                                <p className="text-xs text-slate-400">Vous recevrez une confirmation et aurez accès à toutes les fonctionnalités du plan.</p>
                            </div>
                        </div>
                    </div>

                    {/* Info délai */}
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                        <Clock className="size-4 text-amber-200" />
                        Activation sous 24h ouvrées
                    </div>

                    {/* Contact */}
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                        <Mail className="size-4 text-slate-500" />
                        Une question ? <a href="mailto:support@batixpro.com" className="text-amber-200 hover:underline">support@batixpro.com</a>
                    </div>

                    {/* CTA */}
                    <Link
                        href={`/${auth.user.code_user}/dashboard`}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200"
                    >
                        Retour au dashboard
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
