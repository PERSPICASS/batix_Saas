import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useRoute } from '@/utils/route';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { Warehouse } from 'lucide-react';

export default function Create() {
    const buildRoute = useRoute();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '',
        city: '',
        phone: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(buildRoute('depots.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Nouveau dépôt</h2>}>
            <Head title="Nouveau dépôt" />

            <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-300/10">
                            <Warehouse className="size-5 text-amber-600 dark:text-amber-300" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">Informations du dépôt</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Renseignez les informations de votre nouveau dépôt</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="name" value="Nom du dépôt *" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Ex: Dépôt Central"
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="city" value="Ville" />
                                <TextInput
                                    id="city"
                                    value={data.city}
                                    onChange={e => setData('city', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Ex: Abidjan"
                                />
                                <InputError message={errors.city} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="phone" value="Téléphone" />
                                <TextInput
                                    id="phone"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Ex: +225 0700000000"
                                />
                                <InputError message={errors.phone} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="address" value="Adresse" />
                            <TextInput
                                id="address"
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Ex: Zone Industrielle de Yopougon"
                            />
                            <InputError message={errors.address} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value="Description" />
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900 dark:text-white"
                                placeholder="Description du dépôt..."
                            />
                            <InputError message={errors.description} className="mt-1" />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                            >
                                {processing ? 'Création...' : 'Créer le dépôt'}
                            </button>
                            <a
                                href={buildRoute('depots.index')}
                                className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                            >
                                Annuler
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
