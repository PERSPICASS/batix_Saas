import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-10 text-slate-100">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
                <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
            </div>

            <div className="mb-5 text-center">
                <Link href="/">
                    <ApplicationLogo theme="dark" className="mx-auto h-14 w-auto" />
                </Link>
                <p className="mt-1 text-sm text-slate-300">
                    Espace securise de gestion de quincaillerie
                </p>
            </div>

            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-2xl backdrop-blur-xl">
                {children}
            </div>

            <p className="mt-6 text-xs text-slate-400">
                © {new Date().getFullYear()} Batix SaaS
            </p>
        </div>
    );
}
