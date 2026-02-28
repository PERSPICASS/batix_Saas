import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const [step, setStep] = useState<1 | 2>(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        shop_name: '',
        shop_address: '',
        shop_city: '',
        shop_postal_code: '',
        shop_phone: '',
    });

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.name && data.email && data.password && data.password_confirmation) {
            setStep(2);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Inscription" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">
                    {step === 1 ? 'Créer un compte' : 'Configurer ta boutique'}
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                    {step === 1 
                        ? 'Démarre ton essai et configure ta première boutique.' 
                        : 'Dernière étape : les informations de ta boutique.'}
                </p>
                <Link
                    href="/"
                    className="mt-3 inline-flex text-sm text-amber-200 underline underline-offset-4 transition hover:text-amber-100"
                >
                    Retour à l'accueil
                </Link>
            </div>

            {/* Indicateur d'étape */}
            <div className="mb-6 flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === 1 ? 'bg-amber-300 text-slate-950' : 'bg-green-500 text-white'} text-sm font-semibold`}>
                    {step === 1 ? '1' : '✓'}
                </div>
                <div className={`h-1 flex-1 rounded ${step === 2 ? 'bg-amber-300' : 'bg-slate-700'}`}></div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === 2 ? 'bg-amber-300 text-slate-950' : 'bg-slate-700 text-slate-400'} text-sm font-semibold`}>
                    2
                </div>
            </div>

            <form onSubmit={step === 1 ? handleNextStep : submit}>
                {step === 1 ? (
                    <>
                        <div>
                            <InputLabel
                                htmlFor="name"
                                value="Nom complet"
                                className="text-slate-200"
                            />

                            <TextInput
                                id="name"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300"
                                autoComplete="name"
                                isFocused={true}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />

                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="email"
                                value="Email"
                                className="text-slate-200"
                            />

                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300"
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />

                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="password"
                                value="Mot de passe"
                                className="text-slate-200"
                            />

                            <div className="relative">
                                <TextInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300 pr-10"
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>

                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Confirmer le mot de passe"
                                className="text-slate-200"
                            />

                            <div className="relative">
                                <TextInput
                                    id="password_confirmation"
                                    type={showPasswordConfirmation ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300 pr-10"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData('password_confirmation', e.target.value)
                                    }
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                                >
                                    {showPasswordConfirmation ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>

                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <InputLabel
                                htmlFor="shop_name"
                                value="Nom de la boutique"
                                className="text-slate-200"
                            />

                            <TextInput
                                id="shop_name"
                                name="shop_name"
                                value={data.shop_name}
                                className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300"
                                isFocused={true}
                                onChange={(e) => setData('shop_name', e.target.value)}
                                required
                            />

                            <InputError message={errors.shop_name} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="shop_address"
                                value="Adresse"
                                className="text-slate-200"
                            />

                            <TextInput
                                id="shop_address"
                                name="shop_address"
                                value={data.shop_address}
                                className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300"
                                onChange={(e) => setData('shop_address', e.target.value)}
                            />

                            <InputError message={errors.shop_address} className="mt-2" />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel
                                    htmlFor="shop_city"
                                    value="Ville"
                                    className="text-slate-200"
                                />

                                <TextInput
                                    id="shop_city"
                                    name="shop_city"
                                    value={data.shop_city}
                                    className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300"
                                    onChange={(e) => setData('shop_city', e.target.value)}
                                />

                                <InputError message={errors.shop_city} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="shop_postal_code"
                                    value="Code postal"
                                    className="text-slate-200"
                                />

                                <TextInput
                                    id="shop_postal_code"
                                    name="shop_postal_code"
                                    value={data.shop_postal_code}
                                    className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300"
                                    onChange={(e) => setData('shop_postal_code', e.target.value)}
                                />

                                <InputError message={errors.shop_postal_code} className="mt-2" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="shop_phone"
                                value="Téléphone"
                                className="text-slate-200"
                            />

                            <TextInput
                                id="shop_phone"
                                name="shop_phone"
                                value={data.shop_phone}
                                className="mt-1 block w-full border-white/15 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-amber-300"
                                onChange={(e) => setData('shop_phone', e.target.value)}
                            />

                            <InputError message={errors.shop_phone} className="mt-2" />
                        </div>
                    </>
                )}

                <div className="mt-6 flex items-center justify-between">
                    <div>
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="rounded-md text-sm text-slate-300 underline underline-offset-4 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                            >
                                ← Retour
                            </button>
                        )}
                        {step === 1 && (
                            <Link
                                href={route('login')}
                                className="rounded-md text-sm text-slate-300 underline underline-offset-4 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                            >
                                Déjà inscrit ?
                            </Link>
                        )}
                    </div>

                    <PrimaryButton
                        className="border-0 bg-amber-300 text-slate-950 hover:bg-amber-200 focus:bg-amber-200 focus:ring-amber-300 focus:ring-offset-slate-950 active:bg-amber-300"
                        disabled={processing}
                    >
                        {step === 1 ? 'Continuer →' : 'Créer mon compte'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
