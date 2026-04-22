import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import defaultHeroImage from '/resources/images/bath-saloon-2026-03-19-23-10-32-utc.jpg';

interface AuthSplitLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
    icon?: ReactNode;
    stepper?: ReactNode;
    topLink?: {
        href: string;
        label: string;
    };
    afterContent?: ReactNode;
    sideStepLabel?: string;
    sideTitle: string;
    sideDescription: string;
    sideImageSrc?: string;
}

export default function AuthSplitLayout({
    title,
    description,
    children,
    icon,
    stepper,
    topLink,
    afterContent,
    sideStepLabel = 'Etape',
    sideTitle,
    sideDescription,
    sideImageSrc = defaultHeroImage,
}: AuthSplitLayoutProps) {
    return (
        <div className="h-dvh overflow-hidden bg-[#f5efe4] text-slate-900">
            <div className="grid h-full lg:grid-cols-2">
                <section className="flex h-full items-center justify-center px-4 py-3 sm:px-8 lg:px-10">
                    <div className="w-full max-w-lg flex flex-col">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <ApplicationLogo className="h-12 w-12 fill-current text-amber-600" />
                            
                        </Link>

                        {topLink && (
                            <Link
                                href={topLink.href}
                                className="mt-2 inline-flex text-sm text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
                            >
                                {topLink.label}
                            </Link>
                        )}

                        <div className="mt-4 rounded-3xl border border-[#d6c9b2] bg-[#fbf7ef] p-5 shadow-xl sm:p-6">
                            {stepper}

                            {icon && (
                                <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                    {icon}
                                </div>
                            )}

                            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
                            <p className="mt-1 text-sm text-slate-600">{description}</p>

                            <div className="mt-4">{children}</div>

                            {afterContent && <div className="mt-4">{afterContent}</div>}
                        </div>
                    </div>
                </section>

                <section className="relative hidden h-full overflow-hidden lg:-ml-4 lg:block  lg:shadow-[-28px_0_60px_-24px_rgba(15,23,42,0.55)]">
                    <img src={sideImageSrc} alt="Auth visual" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/35 to-slate-900/15" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">{sideStepLabel}</p>
                        <h2 className="mt-3 max-w-lg text-2xl font-bold leading-tight xl:text-3xl">{sideTitle}</h2>
                        <p className="mt-2 max-w-lg text-sm text-slate-200">{sideDescription}</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
