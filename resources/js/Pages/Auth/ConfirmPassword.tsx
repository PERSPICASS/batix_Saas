import AuthSplitLayout from '@/Components/AuthSplitLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ConfirmPassword() {
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
            <Head title="Confirmation" />

            <AuthSplitLayout
                title="Confirmez votre identite"
                description="Cette zone est protegee. Entrez votre mot de passe pour continuer en toute securite."
                icon={<ShieldCheck className="size-5" />}
                sideStepLabel="Verification"
                sideTitle="Un dernier controle avant d'avancer."
                sideDescription="Cette verification protege vos operations sensibles et vos donnees metier."
            >
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <InputLabel htmlFor="password" value="Mot de passe" className="text-slate-700" />
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
                        Confirmer
                    </PrimaryButton>
                </form>
            </AuthSplitLayout>
        </>
    );
}
