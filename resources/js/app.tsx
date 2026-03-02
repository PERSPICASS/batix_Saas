import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

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

// Rafraîchir le token CSRF périodiquement pour les utilisateurs actifs
let lastActivity = Date.now();
let csrfRefreshInterval: number;

const refreshCSRF = async () => {
    try {
        await fetch('/sanctum/csrf-cookie', {
            credentials: 'same-origin'
        });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token CSRF:', error);
    }
};

// Détecter l'activité de l'utilisateur
const updateActivity = () => {
    lastActivity = Date.now();
};

document.addEventListener('mousemove', updateActivity);
document.addEventListener('keydown', updateActivity);
document.addEventListener('click', updateActivity);
document.addEventListener('scroll', updateActivity);

// Rafraîchir le token toutes les 60 minutes si l'utilisateur est actif
csrfRefreshInterval = window.setInterval(() => {
    const timeSinceLastActivity = Date.now() - lastActivity;
    // Si activité dans les dernières 5 minutes, rafraîchir le token
    if (timeSinceLastActivity < 5 * 60 * 1000) {
        refreshCSRF();
    }
}, 60 * 60 * 1000); // Toutes les 60 minutes

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
