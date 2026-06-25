import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useState } from 'react';
import { policies } from '@/i18n/policies';

interface Props extends PageProps {
  policyType: 'terms' | 'privacy' | 'refund';
  locale?: string;
}

export default function PolicyShow({ policyType, locale = 'en' }: Props) {
  const [lang, setLang] = useState(locale as 'en' | 'fr');
  const policyKey = policyType === 'terms'
    ? 'termsOfService'
    : policyType === 'privacy'
    ? 'privacyPolicy'
    : 'refundPolicy';

  const policy = policies[lang][policyKey as keyof typeof policies['en']];

  if (!policy) {
    return <div>Policy not found</div>;
  }

  return (
    <>
      <Head title={policy.title} />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        {/* Header */}
        <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{policy.title}</h1>
                <p className="mt-2 text-sm text-slate-400">{policy.lastUpdated}</p>
              </div>

              {/* Language Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setLang('en')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    lang === 'en'
                      ? 'bg-amber-300 text-slate-950'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang('fr')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    lang === 'fr'
                      ? 'bg-amber-300 text-slate-950'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  Français
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-8 rounded-lg border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            {Object.entries(policy.sections).map(([key, section]) => (
              <section key={key}>
                <h2 className="text-xl font-bold text-white">{section.heading}</h2>
                <p className="mt-3 text-slate-300 leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>

          {/* Navigation Links */}
          <div className="mt-12 space-y-4 rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-slate-300">Other Policies:</p>
            <div className="flex flex-wrap gap-3">
              {policyType !== 'terms' && (
                <a
                  href="/policies/terms"
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
                >
                  Terms of Service
                </a>
              )}
              {policyType !== 'privacy' && (
                <a
                  href="/policies/privacy"
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
                >
                  Privacy Policy
                </a>
              )}
              {policyType !== 'refund' && (
                <a
                  href="/policies/refund"
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
                >
                  Refund Policy
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
