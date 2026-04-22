import AuthSplitLayout from '@/Components/AuthSplitLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Mail } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Mot de passe oublie" />

            <AuthSplitLayout
                title="Recuperez votre acces"
                description="Renseignez votre email et nous vous envoyons un lien de reinitialisation en quelques secondes."
                icon={<Mail className="size-5" />}
                topLink={{ href: '/', label: "Retour a l'accueil" }}
                sideStepLabel="Recuperation"
                sideTitle="Une etape simple pour repartir rapidement."
                sideDescription="Gardez l'acces a votre compte meme en cas d'oubli de mot de passe."
            >
                {status && (
                    <div className="mb-3 rounded-lg border border-emerald-300/60 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="email" value="Email" className="text-slate-700" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="jean@exemple.com"
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="space-y-2 pt-1">
                        <PrimaryButton className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800" disabled={processing}>
                            Envoyer le lien
                        </PrimaryButton>

                        <div className="text-center">
                            <Link href={route('login')} className="text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-900 sm:text-sm">
                                Retour a la connexion
                            </Link>
                        </div>
                    </div>
                </form>
            </AuthSplitLayout>
        </>
    );
}
