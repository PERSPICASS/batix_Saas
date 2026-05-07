import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { hydrateRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Gestion globale des erreurs Inertia
let csrfErrorShown = false;

router.on('error', (event) => {
    // Détecter les erreurs CSRF (code 419)
    const errors = event.detail.errors;
    
    if (errors && typeof errors === 'object') {
        // Vérifier si c'est une erreur liée au CSRF
        const errorMessage = JSON.stringify(errors).toLowerCase();
        if (errorMessage.includes('csrf') || errorMessage.includes('token') || errorMessage.includes('419')) {
            event.preventDefault();
            
            // Éviter les multiples alertes
            if (!csrfErrorShown) {
                csrfErrorShown = true;
                
                const isAuthPage = window.location.pathname.includes('/login') || 
                                 window.location.pathname.includes('/register');
                
                if (!isAuthPage) {
                    alert('Votre session a expiré pour des raisons de sécurité. Vous allez être redirigé vers la page de connexion.');
                    window.location.href = '/login';
                } else {
                    // Sur page d'auth, juste recharger
                    window.location.reload();
                }
            }
        }
    }
});

// Intercepter les réponses 419 (session/CSRF expirés) — cas non capté par router.on('error')
router.on('invalid', (event) => {
    if (event.detail.response.status === 419) {
        event.preventDefault();
        // Recharger silencieusement la page pour obtenir un nouveau token CSRF
        window.location.reload();
    }
});

// Rafraîchir le token CSRF toutes les 30 minutes (actif ou inactif)
const refreshCSRF = async () => {
    try {
        await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
    } catch {
        // silencieux
    }
};

window.setInterval(refreshCSRF, 30 * 60 * 1000); // toutes les 30 min

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        hydrateRoot(el, <App {...props} />);
    },
    progress: {
        color: '#FBBF24',
    },
});
