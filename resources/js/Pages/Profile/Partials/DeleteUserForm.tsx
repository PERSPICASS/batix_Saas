import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const { t } = useLocale();
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header className="mb-6">
                <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    {t.profile.form.delete.title}
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                    {t.profile.form.delete.description}
                </p>
            </header>

            <button
                onClick={confirmUserDeletion}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
                {t.profile.form.delete.button}
            </button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6 bg-slate-900 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center border border-red-500/30">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">
                            {t.profile.form.delete.modalTitle}
                        </h2>
                    </div>

                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                        <p className="text-sm text-red-200">
                            ⚠️ {t.profile.form.delete.modalDescription}
                        </p>
                    </div>

                    <div className="mt-6">
                        <label htmlFor="password" className="sr-only">
                            {t.profile.form.delete.passwordLabel}
                        </label>

                        <input
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            autoFocus
                            placeholder={t.profile.form.delete.passwordPlaceholder}
                        />

                        <InputError message={errors.password} />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900"
                        >
                            {t.profile.form.delete.cancel}
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                        >
                            {t.profile.form.delete.confirm}
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
