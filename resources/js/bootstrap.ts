import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Ajouter le token CSRF automatiquement à toutes les requêtes
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
}

// Intercepteur pour gérer les erreurs 419 (CSRF token mismatch)
window.axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Si erreur 419 (CSRF token expiré) et pas déjà en train de réessayer
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;
            
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
                    
                    // Réessayer la requête originale avec le nouveau token
                    return window.axios(originalRequest);
                }
            } catch (refreshError) {
                // Si le rafraîchissement échoue, la session est vraiment expirée
                console.error('Session expirée, rechargement nécessaire');
            }
            
            // Si nous sommes ici, c'est que la session est expirée
            // Ne recharger que si ce n'est pas une page de login/register
            const isAuthPage = window.location.pathname.includes('/login') || 
                             window.location.pathname.includes('/register') ||
                             window.location.pathname.includes('/forgot-password');
            
            if (!isAuthPage) {
                // Afficher un message avant de rediriger
                alert('Votre session a expiré. Vous allez être redirigé vers la page de connexion.');
                window.location.href = '/login';
            } else {
                // Sur les pages d'authentification, juste recharger pour obtenir un nouveau token
                window.location.reload();
            }
        }
        
        return Promise.reject(error);
    }
);
