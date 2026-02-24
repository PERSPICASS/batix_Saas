<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Catégories Prédéfinies pour Quincaillerie
    |--------------------------------------------------------------------------
    |
    | Liste des catégories prédéfinies pour le secteur de la quincaillerie.
    | Ces catégories sont automatiquement créées pour chaque nouvelle boutique.
    |
    */

    'predefined' => [
        // Outils manuels et électriques
        [
            'name' => 'Outils à Main',
            'slug' => 'outils-a-main',
            'description' => 'Marteaux, tournevis, clés, pinces, scies manuelles',
            'color' => '#EF4444', // red
            'icon' => 'wrench',
            'is_active' => true,
            'order' => 1,
        ],
        [
            'name' => 'Outils Électriques',
            'slug' => 'outils-electriques',
            'description' => 'Perceuses, meuleuses, scies électriques, ponceuses',
            'color' => '#F59E0B', // amber
            'icon' => 'bolt',
            'is_active' => true,
            'order' => 2,
        ],
        [
            'name' => 'Outillage de Mesure',
            'slug' => 'outillage-mesure',
            'description' => 'Mètres, niveaux, équerres, lasers de mesure',
            'color' => '#3B82F6', // blue
            'icon' => 'ruler',
            'is_active' => true,
            'order' => 3,
        ],

        // Quincaillerie de base
        [
            'name' => 'Visserie & Boulonnerie',
            'slug' => 'visserie-boulonnerie',
            'description' => 'Vis, boulons, écrous, rondelles, chevilles',
            'color' => '#64748B', // slate
            'icon' => 'cog',
            'is_active' => true,
            'order' => 4,
        ],
        [
            'name' => 'Clous & Pointes',
            'slug' => 'clous-pointes',
            'description' => 'Clous, pointes, agrafes, rivets',
            'color' => '#78716C', // stone
            'icon' => 'hashtag',
            'is_active' => true,
            'order' => 5,
        ],
        [
            'name' => 'Quincaillerie d\'Assemblage',
            'slug' => 'quincaillerie-assemblage',
            'description' => 'Équerres, cornières, plaques de fixation, supports',
            'color' => '#6366F1', // indigo
            'icon' => 'puzzle-piece',
            'is_active' => true,
            'order' => 6,
        ],

        // Serrurerie et fermetures
        [
            'name' => 'Serrurerie',
            'slug' => 'serrurerie',
            'description' => 'Serrures, cylindres, verrous, cadenas',
            'color' => '#8B5CF6', // purple
            'icon' => 'lock-closed',
            'is_active' => true,
            'order' => 7,
        ],
        [
            'name' => 'Charnières & Paumelles',
            'slug' => 'charnieres-paumelles',
            'description' => 'Charnières, paumelles, fiches, gonds',
            'color' => '#A855F7', // violet
            'icon' => 'arrows-right-left',
            'is_active' => true,
            'order' => 8,
        ],
        [
            'name' => 'Poignées & Accessoires',
            'slug' => 'poignees-accessoires',
            'description' => 'Poignées de porte, boutons, béquilles, rosaces',
            'color' => '#EC4899', // pink
            'icon' => 'hand-raised',
            'is_active' => true,
            'order' => 9,
        ],

        // Matériaux et construction
        [
            'name' => 'Matériaux de Construction',
            'slug' => 'materiaux-construction',
            'description' => 'Ciment, plâtre, mortier, enduits',
            'color' => '#94A3B8', // gray
            'icon' => 'building-office',
            'is_active' => true,
            'order' => 10,
        ],
        [
            'name' => 'Bois & Panneaux',
            'slug' => 'bois-panneaux',
            'description' => 'Planches, tasseaux, contreplaqué, panneaux',
            'color' => '#92400E', // brown
            'icon' => 'squares-2x2',
            'is_active' => true,
            'order' => 11,
        ],
        [
            'name' => 'Tubes & Profilés',
            'slug' => 'tubes-profiles',
            'description' => 'Tubes acier, PVC, alu, profilés métalliques',
            'color' => '#475569', // slate-dark
            'icon' => 'rectangle-stack',
            'is_active' => true,
            'order' => 12,
        ],

        // Plomberie et électricité
        [
            'name' => 'Plomberie',
            'slug' => 'plomberie',
            'description' => 'Tuyaux, raccords, robinets, joints, sanitaires',
            'color' => '#06B6D4', // cyan
            'icon' => 'wrench-screwdriver',
            'is_active' => true,
            'order' => 13,
        ],
        [
            'name' => 'Électricité',
            'slug' => 'electricite',
            'description' => 'Câbles, prises, interrupteurs, disjoncteurs, gaines',
            'color' => '#FBBF24', // yellow
            'icon' => 'bolt',
            'is_active' => true,
            'order' => 14,
        ],

        // Peinture et décoration
        [
            'name' => 'Peinture & Enduits',
            'slug' => 'peinture-enduits',
            'description' => 'Peintures, vernis, lasures, enduits, primaires',
            'color' => '#10B981', // green
            'icon' => 'paint-brush',
            'is_active' => true,
            'order' => 15,
        ],
        [
            'name' => 'Outils de Peinture',
            'slug' => 'outils-peinture',
            'description' => 'Pinceaux, rouleaux, bacs, pistolets, rubans de masquage',
            'color' => '#14B8A6', // teal
            'icon' => 'sparkles',
            'is_active' => true,
            'order' => 16,
        ],

        // Fixation et collage
        [
            'name' => 'Colles & Mastics',
            'slug' => 'colles-mastics',
            'description' => 'Colles, mastics, silicones, adhésifs, résines',
            'color' => '#F97316', // orange
            'icon' => 'clipboard',
            'is_active' => true,
            'order' => 17,
        ],
        [
            'name' => 'Fixations Spéciales',
            'slug' => 'fixations-speciales',
            'description' => 'Chevilles expansion, scellements chimiques, tiges filetées',
            'color' => '#DC2626', // red-dark
            'icon' => 'link',
            'is_active' => true,
            'order' => 18,
        ],

        // Protection et sécurité
        [
            'name' => 'Équipements de Protection',
            'slug' => 'equipements-protection',
            'description' => 'Gants, lunettes, masques, casques, vêtements de travail',
            'color' => '#059669', // green-dark
            'icon' => 'shield-check',
            'is_active' => true,
            'order' => 19,
        ],
        [
            'name' => 'Sécurité & Signalisation',
            'slug' => 'securite-signalisation',
            'description' => 'Extincteurs, détecteurs, panneaux, rubans de sécurité',
            'color' => '#DC2626', // red
            'icon' => 'exclamation-triangle',
            'is_active' => true,
            'order' => 20,
        ],

        // Jardin et extérieur
        [
            'name' => 'Jardinage',
            'slug' => 'jardinage',
            'description' => 'Outils de jardin, arrosage, tuteurs, grillages',
            'color' => '#84CC16', // lime
            'icon' => 'home',
            'is_active' => true,
            'order' => 21,
        ],
        [
            'name' => 'Aménagement Extérieur',
            'slug' => 'amenagement-exterieur',
            'description' => 'Clôtures, portails, dalles, pavés, bordures',
            'color' => '#22C55E', // green-bright
            'icon' => 'building-storefront',
            'is_active' => true,
            'order' => 22,
        ],

        // Entretien et nettoyage
        [
            'name' => 'Produits d\'Entretien',
            'slug' => 'produits-entretien',
            'description' => 'Nettoyants, décapants, dégraissants, diluants',
            'color' => '#38BDF8', // sky
            'icon' => 'beaker',
            'is_active' => true,
            'order' => 23,
        ],
        [
            'name' => 'Matériel de Nettoyage',
            'slug' => 'materiel-nettoyage',
            'description' => 'Balais, brosses, éponges, seaux, chiffons',
            'color' => '#0EA5E9', // blue-light
            'icon' => 'sparkles',
            'is_active' => true,
            'order' => 24,
        ],

        // Rangement et stockage
        [
            'name' => 'Rangement & Organisation',
            'slug' => 'rangement-organisation',
            'description' => 'Boîtes, bacs, casiers, armoires, établis',
            'color' => '#7C3AED', // violet-dark
            'icon' => 'archive-box',
            'is_active' => true,
            'order' => 25,
        ],

        // Divers
        [
            'name' => 'Accessoires & Consommables',
            'slug' => 'accessoires-consommables',
            'description' => 'Lames, disques, forets, embouts, papier abrasif',
            'color' => '#64748B', // slate
            'icon' => 'squares-plus',
            'is_active' => true,
            'order' => 26,
        ],
        [
            'name' => 'Autres Produits',
            'slug' => 'autres-produits',
            'description' => 'Produits divers et articles non classés',
            'color' => '#9CA3AF', // gray-light
            'icon' => 'ellipsis-horizontal',
            'is_active' => true,
            'order' => 27,
        ],
    ],
];
