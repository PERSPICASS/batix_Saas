import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // BATIX brand primary — a warm terracotta/clay tone (évoque la terre,
                // le grès, le matériau — cohérent avec l'univers quincaillerie).
                // Utilisé comme couleur dominante (façon Brevo blanc+vert) ; amber
                // reste réservé à de petites touches d'accent (badges, highlights).
                terre: {
                    50: '#FAF1EC',
                    100: '#F2DDCE',
                    200: '#E4BC9C',
                    300: '#D69A6B',
                    400: '#C67D48',
                    500: '#B06333',
                    600: '#A0522D',
                    700: '#7E4024',
                    800: '#5C2F1B',
                    900: '#3B1E11',
                },
            },
        },
    },

    plugins: [forms],
};
