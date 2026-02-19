import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Mot de passe oublie" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Mot de passe oublie</h1>
                <p className="mt-1 text-sm text-slate-300">
                    Renseigne ton email pour recevoir un lien de reinitialisation.
                </p>
                <Link
                    href="/"
                    className="mt-3 inline-flex text-sm text-amber-200 underline underline-offset-4 transition hover:text-amber-100"
                >
                    Retour a l'accueil
                </Link>
            </div>

            {status && (
                <div className="mb-4 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton
                        className="ms-4 border-0 bg-amber-300 text-slate-950 hover:bg-amber-200 focus:bg-amber-200 focus:ring-amber-300 focus:ring-offset-slate-950 active:bg-amber-300"
                        disabled={processing}
                    >
                        Envoyer le lien
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
