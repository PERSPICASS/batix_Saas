<?php

return [
    // Common mail elements
    'common' => [
        'salutation' => 'Bonjour',
        'regards' => 'Cordialement',
        'signature' => 'Cet email a été envoyé automatiquement, merci de ne pas y répondre.',
        'copyright' => '© :year :appName. Tous droits réservés.',
        'questions_contact' => 'Si vous avez des questions, n\'hésitez pas à nous contacter.',
        'support_contact' => 'Pour toute question, contactez notre support',
    ],

    // Invoice email
    'invoice' => [
        'title' => 'Facture :number',
        'greeting' => ':salutation :name,',
        'intro' => 'Merci pour votre confiance. Veuillez trouver ci-joint votre facture n° **:invoiceNumber** datée du :invoiceDate.',
        'details_title' => 'Détails de la facture',
        'description' => 'Description',
        'amount' => 'Montant',
        'subtotal' => 'Sous-total',
        'tax' => 'TVA',
        'total' => 'Total',
        'notes_title' => 'Notes',
        'payment_info_title' => 'Informations de paiement',
        'payment_terms' => 'Modalités de paiement: À réception de la facture',
        'payment_due_days' => 'Délai de paiement: :days jours',
        'questions' => 'Si vous avez des questions, n\'hésitez pas à nous contacter.',
        'signature' => 'Cordialement,',
    ],

    // Quote email
    'quote' => [
        'title' => 'Devis :number',
        'greeting' => ':salutation :name,',
        'intro' => 'Veuillez trouver ci-joint notre devis n° **:quoteNumber** datée du :quoteDate.',
        'details_title' => 'Détails du devis',
        'description' => 'Description',
        'amount' => 'Montant',
        'subtotal' => 'Sous-total',
        'tax' => 'TVA',
        'total' => 'Total',
        'validity_title' => 'Validité du devis',
        'validity_message' => 'Ce devis est valable jusqu\'au **:expiryDate**.',
        'notes_title' => 'Notes',
        'terms_title' => 'Conditions commerciales',
        'confirm_message' => 'Pour confirmer votre accord et passer commande, veuillez nous faire parvenir ce devis signé ou simplement nous le confirmer par email.',
        'questions' => 'Si vous avez des questions, n\'hésitez pas à nous contacter.',
        'signature' => 'Cordialement,',
    ],

    // Subscription invoice
    'subscription_invoice' => [
        'header_subtitle' => 'Reçu de paiement',
        'greeting' => ':salutation :name,',
        'intro' => 'Merci pour votre abonnement. Votre paiement a été reçu avec succès. Voici votre facture récapitulative.',
        'payment_confirmed' => '✓ Paiement confirmé',
        'invoice_details_title' => 'Détails de la facture',
        'plan_label' => 'Plan',
        'billing_cycle_label' => 'Cycle de facturation',
        'payment_method_label' => 'Méthode de paiement',
        'phone_number_label' => 'Numéro utilisé',
        'payment_date_label' => 'Date de paiement',
        'billing_yearly' => 'Annuel',
        'billing_monthly' => 'Mensuel',
        'total_paid_label' => 'Total payé',
        'subscription_active' => '🗓️ Votre abonnement **:planName** est actif du **:startDate**:endDate.',
        'subscription_active_end_date' => ' au **:endDate**',
        'subscription_active_no_expiry' => ' (sans date d\'expiration)',
        'keep_email' => 'Conservez cet email comme justificatif de paiement.',
        'footer' => 'Cet email a été envoyé automatiquement, merci de ne pas y répondre.',
        'questions' => 'Pour toute question, contactez notre support',
    ],

    // Subscription expiry reminder
    'subscription_expiry' => [
        'header_subtitle' => 'Gestion moderne des quincailleries',
        'expired' => 'Votre abonnement a expiré',
        'days_left_singular' => 'jour restant',
        'days_left_plural' => 'jours restants',
        'plan_label' => 'Plan',
        'expiration_label' => 'Expiration',
        'greeting' => ':salutation :name,',
        'expiry_today' => 'Votre abonnement **:planName** expire demain. Pour continuer à utiliser :appName sans interruption, renouvelez dès maintenant.',
        'expiry_soon' => 'Votre abonnement **:planName** expire dans **:days jours**. Pensez à renouveler pour ne pas interrompre votre activité.',
        'renew_button' => 'Renouveler mon abonnement',
        'footer_header' => ':appName — support@batixpro.com',
        'footer_message' => 'Vous recevez cet email car votre abonnement arrive à échéance.',
    ],

    // Verification code email
    'verification_code' => [
        'header_title' => '🔐 Code de Vérification',
        'greeting' => ':salutation :name,',
        'intro' => 'Bienvenue sur :appName ! Pour finaliser la création de votre compte, veuillez utiliser le code de vérification ci-dessous :',
        'code_label' => 'Votre code de vérification',
        'code_expiry' => '⏱️ Ce code expire dans 15 minutes',
        'instruction' => 'Saisissez ce code sur la page de vérification pour activer votre compte et commencer à utiliser toutes les fonctionnalités de notre plateforme.',
        'warning_title' => '⚠️ Important :',
        'warning_message' => 'Si vous n\'avez pas créé de compte sur :appName, veuillez ignorer cet email. Votre adresse email pourrait avoir été saisie par erreur.',
        'security_note' => 'Pour des raisons de sécurité, ne partagez jamais ce code avec qui que ce soit. Notre équipe ne vous demandera jamais votre code de vérification.',
        'footer_automatic' => 'Cet email a été envoyé automatiquement, veuillez ne pas y répondre.',
        'footer_support' => 'Pour toute question, contactez notre support',
    ],

    // Contact form email
    'contact_form' => [
        'header_title' => '✉️ Nouveau message de contact',
        'header_subtitle' => 'Reçu via le formulaire de la landing page BATIX PRO',
        'name_label' => 'Nom',
        'email_label' => 'Email',
        'subject_label' => 'Sujet',
        'message_label' => 'Message',
        'footer' => 'Cet email a été envoyé automatiquement depuis la landing page de :appName.',
    ],
];
