import { createInertiaApp } from '@inertiajs/react';
import { renderToString } from 'react-dom/server';
import _createServer from '@inertiajs/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { route } from 'ziggy-js';
import { LocaleProvider } from '@/contexts/LocaleContext';

// CJS/ESM interop : module.exports = { default: fn }
const createServer = (_createServer as any).default ?? _createServer;

createServer((page: any) =>
    createInertiaApp({
        page,
        render: renderToString,
        resolve: (name) =>
            resolvePageComponent(
                `./Pages/${name}.tsx`,
                import.meta.glob('./Pages/**/*.tsx'),
            ),
        setup: ({ App, props }) => {
            // Rendre route() disponible globalement avec les routes Ziggy de la page
            (global as any).route = (name: string, params?: any, absolute?: boolean) =>
                route(name, params, absolute, (props as any).initialPage.props.ziggy);
            return (
                <LocaleProvider>
                    <App {...props} />
                </LocaleProvider>
            );
        },
    }),
);
