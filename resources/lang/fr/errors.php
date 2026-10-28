<?php

return [
    'code' => 'Erreur :code',
    'back' => 'Retour',
    'dashboard' => 'Tableau de bord',
    'home' => "Retour à l'accueil",
    'login' => 'Se connecter',
    'reload' => 'Recharger la page',
    'retry' => 'Réessayer',

    '401' => ['title' => 'Connexion requise', 'message' => 'Connectez-vous pour accéder à cette page.'],
    '402' => ['title' => 'Abonnement requis', 'message' => "Cette fonctionnalité n'est pas incluse dans votre abonnement actuel."],
    '403' => [
        'title' => 'Accès refusé',
        'message' => "Votre compte n'a pas accès à cette page.",
        'hint' => "Si vous pensez en avoir besoin, demandez à l'administrateur du compte de vous donner ce droit (Utilisateurs → Permissions).",
    ],
    '404' => ['title' => 'Page introuvable', 'message' => "Cette page n'existe pas ou n'existe plus. Vérifiez l'adresse, ou l'élément a peut-être été supprimé."],
    '419' => ['title' => 'Session expirée', 'message' => 'La page est restée ouverte trop longtemps. Rechargez-la, puis recommencez.'],
    '429' => ['title' => 'Trop de tentatives', 'message' => 'Patientez une minute avant de réessayer.'],
    '500' => ['title' => 'Une erreur est survenue', 'message' => "Le problème vient de chez nous et l'équipe a été prévenue. Réessayez dans quelques instants."],
    '503' => ['title' => 'Maintenance en cours', 'message' => "BATIX PRO est en cours de mise à jour. L'application revient dans quelques minutes."],

    // Refus du middleware de permissions : on nomme le droit qui manque.
    'permission' => "Vous n'avez pas le droit de :action : :module.",
    'actions' => ['view' => 'consulter', 'create' => 'créer', 'edit' => 'modifier', 'delete' => 'supprimer'],
];
