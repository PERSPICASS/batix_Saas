import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        theme = 'auto',
        ...props
    }: InputHTMLAttributes<HTMLInputElement> & {
        isFocused?: boolean;
        /**
         * `light` : toujours clair, pour les pages de connexion (AuthSplitLayout, carte
         * blanche quel que soit le thème). `auto` suit le mode sombre de l'application —
         * forcé en blanc pour tout le monde, il blanchissait les champs des Achats.
         */
        theme?: 'auto' | 'light';
    },
    ref,
) {
    const localRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-md border-gray-300 bg-white text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 ' +
                (theme === 'light'
                    ? 'dark:border-slate-700 dark:bg-white dark:text-slate-900 dark:placeholder:text-slate-500 '
                    : 'dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-500 ') +
                className
            }
            ref={localRef}
        />
    );
});
