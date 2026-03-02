import { FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { Store, MapPin, Phone } from 'lucide-react';

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
        <GuestLayout>
            <Head title="Créer votre boutique" />

            <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-300/10">
                    <Store className="size-8 text-amber-300" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                    Étape 3/3 : Créez votre boutique
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    Renseignez les informations de votre première boutique pour commencer à utiliser l'application.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                {/* Nom de la boutique */}
                <div>
                    <InputLabel htmlFor="name" value="Nom de la boutique *" />
                    <div className="relative mt-1">
                        <Store className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                        <TextInput
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full pl-10"
                            autoComplete="organization"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            placeholder="Ex: Quincaillerie Centrale"
                        />
                    </div>
                    <InputError message={errors.name} className="mt-2" />
                </div>

                {/* Adresse */}
                <div>
                    <InputLabel htmlFor="address" value="Adresse (optionnel)" />
                    <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                        <TextInput
                            id="address"
                            type="text"
                            name="address"
                            value={data.address}
                            className="mt-1 block w-full pl-10"
                            autoComplete="street-address"
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="123 Rue principale"
                        />
                    </div>
                    <InputError message={errors.address} className="mt-2" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Ville */}
                    <div>
                        <InputLabel htmlFor="city" value="Ville (optionnel)" />
                        <TextInput
                            id="city"
                            type="text"
                            name="city"
                            value={data.city}
                            className="mt-1 block w-full"
                            autoComplete="address-level2"
                            onChange={(e) => setData('city', e.target.value)}
                            placeholder="Casablanca"
                        />
                        <InputError message={errors.city} className="mt-2" />
                    </div>

                    {/* Code postal */}
                    <div>
                        <InputLabel htmlFor="postal_code" value="Code postal (optionnel)" />
                        <TextInput
                            id="postal_code"
                            type="text"
                            name="postal_code"
                            value={data.postal_code}
                            className="mt-1 block w-full"
                            autoComplete="postal-code"
                            onChange={(e) => setData('postal_code', e.target.value)}
                            placeholder="20000"
                        />
                        <InputError message={errors.postal_code} className="mt-2" />
                    </div>
                </div>

                {/* Téléphone */}
                <div>
                    <InputLabel htmlFor="phone" value="Téléphone (optionnel)" />
                    <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                        <TextInput
                            id="phone"
                            type="tel"
                            name="phone"
                            value={data.phone}
                            className="mt-1 block w-full pl-10"
                            autoComplete="tel"
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="+212 6 12 34 56 78"
                        />
                    </div>
                    <InputError message={errors.phone} className="mt-2" />
                </div>

                <div className="space-y-4">
                    <PrimaryButton className="w-full justify-center" disabled={processing}>
                        {processing ? 'Création en cours...' : 'Créer ma boutique'}
                    </PrimaryButton>

                    <p className="text-center text-xs text-slate-500">
                        En créant votre boutique, vous bénéficiez automatiquement de{' '}
                        <span className="font-semibold text-amber-300">30 jours d'essai gratuit</span>.
                    </p>
                </div>
            </form>

            {/* Indicateur d'étapes */}
            <div className="mt-8 flex items-center justify-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-400">
                    ✓
                </div>
                <div className="h-1 w-12 rounded-full bg-emerald-500/20"></div>
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-400">
                    ✓
                </div>
                <div className="h-1 w-12 rounded-full bg-amber-300/20"></div>
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-300 text-sm font-semibold text-slate-950">
                    3
                </div>
            </div>
        </GuestLayout>
    );
}
