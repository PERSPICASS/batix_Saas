<?php

return [
    // Common mail elements
    'common' => [
        'salutation' => 'Hello',
        'regards' => 'Best regards',
        'signature' => 'This email was sent automatically, please do not reply.',
        'copyright' => '© :year :appName. All rights reserved.',
        'questions_contact' => 'If you have any questions, please don\'t hesitate to contact us.',
        'support_contact' => 'For any questions, contact our support',
    ],

    // Invoice email
    'invoice' => [
        'subject' => 'Invoice :number',
        'title' => 'Invoice :number',
        'greeting' => ':salutation :name,',
        'intro' => 'Thank you for your trust. Please find attached your invoice no. **:invoiceNumber** dated :invoiceDate.',
        'details_title' => 'Invoice Details',
        'description' => 'Description',
        'amount' => 'Amount',
        'subtotal' => 'Subtotal',
        'tax' => 'Tax',
        'total' => 'Total',
        'notes_title' => 'Notes',
        'payment_info_title' => 'Payment Information',
        'payment_terms' => 'Payment terms: Upon receipt of invoice',
        'payment_due_days' => 'Payment period: :days days',
        'questions' => 'If you have any questions, please don\'t hesitate to contact us.',
        'signature' => 'Best regards,',
    ],

    // Quote email
    'quote' => [
        'subject' => 'Quote :number',
        'title' => 'Quote :number',
        'greeting' => ':salutation :name,',
        'intro' => 'Please find attached our quote no. **:quoteNumber** dated :quoteDate.',
        'details_title' => 'Quote Details',
        'description' => 'Description',
        'amount' => 'Amount',
        'subtotal' => 'Subtotal',
        'tax' => 'Tax',
        'total' => 'Total',
        'validity_title' => 'Quote Validity',
        'validity_message' => 'This quote is valid until **:expiryDate**.',
        'notes_title' => 'Notes',
        'terms_title' => 'Terms and Conditions',
        'confirm_message' => 'To confirm your agreement and place an order, please send us this signed quote or simply confirm it by email.',
        'questions' => 'If you have any questions, please don\'t hesitate to contact us.',
        'signature' => 'Best regards,',
    ],

    // Subscription invoice
    'subscription_invoice' => [
        'subject' => 'Your :appName Invoice — :invoiceNumber',
        'header_subtitle' => 'Receipt of Payment',
        'greeting' => ':salutation :name,',
        'intro' => 'Thank you for your subscription. Your payment has been received successfully. Here is your invoice summary.',
        'payment_confirmed' => '✓ Payment Confirmed',
        'invoice_details_title' => 'Invoice Details',
        'plan_label' => 'Plan',
        'billing_cycle_label' => 'Billing Cycle',
        'payment_method_label' => 'Payment Method',
        'phone_number_label' => 'Phone Number Used',
        'payment_date_label' => 'Payment Date',
        'billing_yearly' => 'Annual',
        'billing_monthly' => 'Monthly',
        'total_paid_label' => 'Total Paid',
        'subscription_active' => 'Your subscription :planName is active from :startDate:endDate.',
        'subscription_active_end_date' => ' until :endDate',
        'subscription_active_no_expiry' => ' (no expiration date)',
        'keep_email' => 'Keep this email as proof of payment.',
        'footer' => 'This email was sent automatically, please do not reply.',
        'questions' => 'For any questions, contact our support',
    ],

    // Subscription expiry reminder
    'subscription_expiry' => [
        'subject_expires_today' => 'Your :appName subscription expires tomorrow!',
        'subject_expires_soon' => 'Your :appName subscription expires in :days days',
        'header_subtitle' => 'Modern hardware store management',
        'expired' => 'Your subscription has expired',
        'days_left_singular' => 'day remaining',
        'days_left_plural' => 'days remaining',
        'plan_label' => 'Plan',
        'expiration_label' => 'Expiration',
        'greeting' => ':salutation :name,',
        'expiry_today' => 'Your subscription **:planName** expires tomorrow. To continue using :appName without interruption, renew now.',
        'expiry_soon' => 'Your subscription **:planName** expires in **:days days**. Remember to renew to avoid interrupting your activities.',
        'renew_button' => 'Renew My Subscription',
        'footer_header' => ':appName — support@batixpro.com',
        'footer_message' => 'You are receiving this email because your subscription is expiring.',
    ],

    // Verification code email
    'verification_code' => [
        'subject' => 'Verification Code - :appName',
        'header_title' => '🔐 Verification Code',
        'greeting' => ':salutation :name,',
        'intro' => 'Welcome to :appName! To complete your account creation, please use the verification code below:',
        'code_label' => 'Your verification code',
        'code_expiry' => '⏱️ This code expires in 15 minutes',
        'instruction' => 'Enter this code on the verification page to activate your account and start using all the features of our platform.',
        'warning_title' => '⚠️ Important:',
        'warning_message' => 'If you have not created an account on :appName, please ignore this email. Your email address may have been entered by mistake.',
        'security_note' => 'For security reasons, never share this code with anyone. Our team will never ask you for your verification code.',
        'footer_automatic' => 'This email was sent automatically, please do not reply.',
        'footer_support' => 'For any questions, contact our support',
    ],

    // Contact form email
    'contact_form' => [
        'subject' => '[BATIX PRO] :subject — :senderName',
        'header_title' => '✉️ New Contact Message',
        'header_subtitle' => 'Received via the BATIX PRO landing page form',
        'name_label' => 'Name',
        'email_label' => 'Email',
        'subject_label' => 'Subject',
        'message_label' => 'Message',
        'footer' => 'This email was sent automatically from the landing page of :appName.',
    ],

    // Follow-ups after the free trial ends (trials:send-followups)
    'trial_followup' => [
        'greeting' => 'Hello :name,',
        'cta' => 'Choose my plan',
        'help_cta' => 'Message support on WhatsApp',
        'your_activity' => 'During your trial you created **:products product(s)** and recorded **:sales sale(s)**. All of it is kept.',
        'footer' => ':appName — modern hardware store management',
        'unsubscribe' => 'Stop these reminders',
        'steps' => [
            1 => [
                'subject' => 'Your :appName trial has ended — your data is kept',
                'title' => 'Your trial has ended',
                'body' => 'Your 14-day free trial is over. Your account is now read-only: you can still view your data, but no longer record sales or change your stock. Pick a plan to carry on where you left off, in two minutes.',
            ],
            3 => [
                'subject' => 'What :appName changes in a hardware store, every day',
                'title' => 'Save time every day',
                'body' => 'Stock updated with every sale, a fast till that works offline, invoices and quotes in one click, customer credit tracked, several shops and depots in one place: that is what our customers get as soon as they activate a plan.',
            ],
            7 => [
                'subject' => 'Need help getting started with :appName?',
                'title' => 'We can help you get started',
                'body' => 'Importing your catalogue, setting up your shop, training your cashier: if something held you back during the trial, our team can help. Message us on WhatsApp and we will get back to you quickly.',
            ],
            14 => [
                'subject' => 'Your shop is waiting for you on :appName',
                'title' => 'Your data is waiting for you',
                'body' => 'Your products, customers and history are all still there. Activate a plan to find your account exactly as you left it.',
            ],
            30 => [
                'subject' => 'A last message from :appName',
                'title' => 'We are here when you need us',
                'body' => 'This is our last reminder: we will not write to you about this again. Your account stays available; whenever you want to resume, just pick a plan.',
            ],
        ],
        'unsubscribed_title' => 'Unsubscribed',
        'unsubscribed_body' => 'You will no longer receive reminders about your trial. Your account stays available at any time.',
    ],
];
