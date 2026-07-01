import AuthSplitLayout from '@/Components/AuthSplitLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export default function ConfirmPassword() {
    const { t } = useLocale();
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title={t.auth.pages.confirmPassword.title} />

            <AuthSplitLayout
                title={t.auth.pages.confirmPassword.heading}
                description={t.auth.pages.confirmPassword.description}
                icon={<ShieldCheck className="size-5" />}
                sideStepLabel={t.auth.pages.confirmPassword.sideLabel}
                sideTitle={t.auth.pages.confirmPassword.sideTitle}
                sideDescription={t.auth.pages.confirmPassword.sideDescription}
            >
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="password" value={t.auth.form.password} className="text-slate-700" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full border border-[#cfc3ac] bg-white text-slate-900 placeholder-slate-400"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <PrimaryButton className="w-full justify-center bg-slate-900 py-2.5 text-sm normal-case tracking-normal hover:bg-slate-800" disabled={processing}>
                        {t.auth.actions.confirm}
                    </PrimaryButton>
                </form>
            </AuthSplitLayout>
        </>
    );
}
