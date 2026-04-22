import AuthSplitLayout from '@/Components/AuthSplitLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { MapPin, Phone, Store } from 'lucide-react';

export default function CreateShop() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '',
        city: '',
        postal_code: '',
        phone: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('shop.store.initial'));
    };

    return (
        <>
            <Head title="Creer votre boutique" />

            <AuthSplitLayout
                title="Etape 3/3 : Creez votre boutique"
                description="Renseignez les informations de votre premiere boutique pour commencer a utiliser Batix."
                icon={<Store className="size-5" />}
                stepper={
                    <div className="mb-4 flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">✓</div>
                        <div className="h-1 w-10 rounded-full bg-emerald-400" />
                        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">✓</div>
                        <div className="h-1 w-10 rounded-full bg-amber-400" />
                        <div className="flex size-7 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">3</div>
                    </div>
                }
                sideStepLabel="Etape 3 sur 3"
                sideTitle="Votre boutique prend forme."
                sideDescription="Encore quelques informations et vous pourrez demarrer vos operations en conditions reelles."
                afterContent={
                    <p className="text-center text-xs text-slate-500">
                        En creant votre boutique, vous beneficiez automatiquement de{' '}
                        <span className="font-semibold text-amber-700">14 jours d'essai gratuit</span>.
                    </p>
                }
            >
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="name" value="Nom de la boutique *" className="text-slate-700" />
                        <div className="relative mt-1">
                            <Store className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                            <TextInput
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full border border-[#cfc3ac] bg-white pl-10 text-slate-900 placeholder-slate-400"
                                autoComplete="organization"
                                isFocused={true}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                placeholder="Ex: Quincaillerie Centrale"
                            />
                        </div>
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="address" value="Adresse (optionnel)" className="text-slate-700" />
                        <div className="relative mt-1">
                            <MapPin className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                            <TextInput
                                id="address"
                                type="text"
                                name="address"
                                value={data.address}
                                className="mt-1 block w-full border border-[#cfc3ac] bg-white pl-10 text-slate-900 placeholder-slate-400"
                                autoComplete="street-address"
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="123 Rue principale"
                            />
                        </div>
                        <InputError message={errors.address} className="mt-2" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="city" value="Ville (optionnel)" className="text-slate-700" />
                            <TextInput
                                id="city"
                                type="text"
                                name="city"
                                value={data.city}
                                className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400"
                                autoComplete="address-level2"
                                onChange={(e) => setData('city', e.target.value)}
                                placeholder="Casablanca"
                            />
                            <InputError message={errors.city} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="postal_code" value="Code postal (optionnel)" className="text-slate-700" />
                            <TextInput
                                id="postal_code"
                                type="text"
                                name="postal_code"
                                value={data.postal_code}
                                className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400"
                                autoComplete="postal-code"
                                onChange={(e) => setData('postal_code', e.target.value)}
                                placeholder="20000"
                            />
                            <InputError message={errors.postal_code} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="phone" value="Telephone (optionnel)" className="text-slate-700" />
                        <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                            <TextInput
                                id="phone"
                                type="tel"
                                name="phone"
                                value={data.phone}
                                className="mt-1 block w-full border border-[#cfc3ac] bg-white pl-10 text-slate-900 placeholder-slate-400"
                                autoComplete="tel"
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="+212 6 12 34 56 78"
                            />
                        </div>
                        <InputError message={errors.phone} className="mt-2" />
                    </div>

                    <PrimaryButton className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800" disabled={processing}>
                        {processing ? 'Creation en cours...' : 'Creer ma boutique'}
                    </PrimaryButton>
                </form>
            </AuthSplitLayout>
        </>
    );
}
