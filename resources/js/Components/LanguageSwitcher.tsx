import { useLocale } from '@/contexts/LocaleContext';
import type { Locale } from '@/types/types';

export default function LanguageSwitcher() {
    const { locale, setLocale } = useLocale();

    return (
        <div className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-200 text-xs dark:border-white/10 dark:bg-white/5">
            {(['fr', 'en'] as Locale[]).map((l) => (
                <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={`px-2.5 py-2 font-semibold transition first:rounded-l-lg last:rounded-r-lg ${
                        locale === l
                            ? 'bg-amber-300 text-slate-950'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                >
                    {l.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
