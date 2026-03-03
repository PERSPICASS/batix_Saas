import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Ajouter le token CSRF automatiquement à toutes les requêtes
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
}

// Variable pour éviter les boucles infinies
let isRefreshingCSRF = false;

// Intercepteur pour gérer les erreurs 419 (CSRF token mismatch)
window.axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Si erreur 419 (CSRF token expiré) et pas déjà en train de réessayer
        if (error.response?.status === 419 && !originalRequest._retry && !isRefreshingCSRF) {
            originalRequest._retry = true;
            
            // Vérifier si on est sur une page d'authentification
            const isAuthPage = window.location.pathname.includes('/login') || 
                             window.location.pathname.includes('/register') ||
                             window.location.pathname.includes('/forgot-password') ||
                             window.location.pathname.includes('/reset-password') ||
                             window.location.pathname.includes('/verify-email') ||
                             window.location.pathname.includes('/platform-admin/login');
            
            // Sur les pages d'auth, afficher un message et recharger
            if (isAuthPage) {
                console.log('CSRF token expired on auth page');
                // Ne pas afficher d'alerte car le refresh du token est géré par le formulaire lui-même
                // Si on arrive ici, c'est qu'il y a un problème plus grave
                if (!originalRequest.url?.includes('/sanctum/csrf-cookie')) {
                    alert('Votre session a expiré. Veuillez recharger la page et réessayer.');
                    window.location.reload();
                }
                return Promise.reject(error);
            }
            
            isRefreshingCSRF = true;
            
            try {
                // Essayer de rafraîchir le token CSRF sans recharger la page
                const response = await fetch('/sanctum/csrf-cookie', {
                    credentials: 'same-origin'
                });
                
                if (response.ok) {
                    // Mettre à jour le token CSRF
                    const newToken = document.head.querySelector('meta[name="csrf-token"]');
                    if (newToken) {
                        const tokenValue = newToken.getAttribute('content');
                        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = tokenValue;
                        originalRequest.headers['X-CSRF-TOKEN'] = tokenValue;
                    }
                    
                    isRefreshingCSRF = false;
                    
                    // Réessayer la requête originale avec le nouveau token
                    return window.axios(originalRequest);
                }
            } catch (refreshError) {
                isRefreshingCSRF = false;
                console.error('Session expirée, rechargement nécessaire');
            }
            
            isRefreshingCSRF = false;
            
            // Si nous sommes ici, c'est que la session est expirée
            // Afficher un message avant de rediriger
            alert('Votre session a expiré. Vous allez être redirigé vers la page de connexion.');
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);
