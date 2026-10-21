# 📊 Google Analytics 4 Setup Guide - BATIX PRO

**Date**: 2026-06-23  
**Temps estimé**: 45 minutes pour setup complet

---

## 🎯 Objectifs Analytics

Tracker ces 4 métriques clés :

1. **Organic Traffic** → Montrer ROI SEO
2. **Trial Signups** → Conversions depuis organic
3. **Feature Engagement** → Quels users se convertissent
4. **Revenue Attribution** → Organic users → paying customers

---

## 📋 Étape 1: Créer Property Google Analytics 4

### 1.1 Aller à Google Analytics
```
https://analytics.google.com
```

### 1.2 Créer Nouveau Project
- Cliquer "Create"
- Account name: "BATIX PRO"
- Property name: "BATIX PRO - Production"
- Reporting timezone: "Europe/Paris"
- Currency: "EUR"

### 1.3 Ajouter Web Stream
- Platform: "Web"
- Website URL: "https://batixpro.com"
- Stream name: "Website"

### 1.4 Copier Measurement ID
```
Format: G-XXXXXXXXXX
Vous en aurez besoin pour Laravel
```

---

## 🔧 Étape 2: Intégrer dans Laravel

### 2.1 Ajouter Measurement ID à .env
```env
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 2.2 Ajouter au Blade Template (app.blade.php)
```blade
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id={{ env('GOOGLE_ANALYTICS_ID') }}"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '{{ env('GOOGLE_ANALYTICS_ID') }}', {
        'page_path': window.location.pathname,
    });
</script>
```

### 2.3 Vérifier Installation
```
Aller à Google Analytics Dashboard
→ Realtime
→ Visiter https://batixpro.com
→ Voir "Active Users = 1"
```

---

## 🎯 Étape 3: Setup des Conversions

### 3.1 Créer Conversion: "trial_signup"

```
Google Analytics > Events > Create Event
Event name: trial_signup
Description: "User started free trial"
```

### 3.2 Trigger dans React/Inertia

Pour chaque CTA "Démarrer essai gratuit" ajouter :

```javascript
// src/Components/HeroSection.tsx (exemple)
const handleTrialSignup = () => {
    // Trigger GA4 event
    gtag('event', 'trial_signup', {
        'event_category': 'engagement',
        'event_label': 'CTA - Hero section',
    });
    
    // Redirect
    window.location.href = '/register';
};
```

### 3.3 Conversions à Tracker

```javascript
// 1. Trial Signup
gtag('event', 'trial_signup', {
    'event_category': 'conversion',
    'event_label': 'Free trial signup',
    'value': 0
});

// 2. Plan Selection
gtag('event', 'plan_selected', {
    'event_category': 'engagement',
    'event_label': plan_name, // e.g., "Growth"
    'value': plan_price
});

// 3. Video Played
gtag('event', 'video_engagement', {
    'event_category': 'engagement',
    'event_label': 'Demo video',
    'value': '00:45' // duration
});

// 4. Blog Post Read
gtag('event', 'page_view', {
    'event_category': 'blog',
    'event_label': post_title,
    'value': read_time // minutes
});

// 5. Contact Form Submitted
gtag('event', 'contact_form_submit', {
    'event_category': 'engagement',
    'event_label': 'Contact form',
});
```

---

## 📊 Étape 4: Setup des Audiences

### 4.1 Créer Audience: "Trial Users"

```
Google Analytics > Audiences > Create New Audience
Audience name: "Trial Users"
Condition: trial_signup event occurred
```

### 4.2 Créer Audience: "Organic Traffic"

```
Google Analytics > Audiences > Create New Audience
Audience name: "Organic Traffic"
Condition: source == organic
```

### 4.3 Créer Audience: "High-Value Users"

```
Google Analytics > Audiences > Create New Audience
Audience name: "High-Value Users"
Condition: 
  - trial_signup event occurred
  - AND time_on_site > 180 seconds
  - AND visited_page >= 3
```

---

## 📈 Étape 5: Setup des Dashboards

### 5.1 Dashboard 1: "Organic Performance"

Ajouter des cartes:

**Card 1: Organic Users**
```
Metric: Users
Filter: source == organic
Date range: Last 30 days
Comparison: Previous 30 days
```

**Card 2: Trial Signups from Organic**
```
Metric: Events (trial_signup)
Filter: source == organic
Date range: Last 30 days
```

**Card 3: Conversion Rate**
```
Metric: Conversions / Users
Filter: source == organic
Target: 5% (trial signup rate)
```

**Card 4: Top Landing Pages**
```
Metric: Users
Dimension: Page Title
Filter: source == organic
Limit: Top 10
```

**Card 5: Organic Traffic Trend**
```
Metric: Users
Dimension: Date
Filter: source == organic
Chart: Line graph
```

### 5.2 Dashboard 2: "Blog Performance"

**Card 1: Blog Pageviews**
```
Metric: Page views
Filter: page_path contains "/blog"
```

**Card 2: Blog Conversion Rate**
```
Metric: trial_signup events
Filter: previous page contains "/blog"
```

**Card 3: Top Blog Posts**
```
Metric: Users
Dimension: Page Title
Filter: page_path contains "/blog"
```

**Card 4: Time on Blog**
```
Metric: Engagement Rate
Dimension: Page Title
Filter: page_path contains "/blog"
```

### 5.3 Dashboard 3: "Funnel Analysis"

**Card 1: Traffic Source Comparison**
```
Metric: Users
Dimension: Source
Visualization: Table
```

**Card 2: Conversion Funnel**
```
Step 1: All Users
Step 2: Trial Signup Events
Step 3: Plan Selection Events
Step 4: ? (Add when you have payment tracking)
```

---

## 🔗 Étape 6: Setup UTM Tracking

### 6.1 Ajouter UTM Parameters

Pour tous vos liens externes (guest posts, social, etc.):

```
Base URL: https://batixpro.com
utm_source: (where from - linkedin, medium, twitter)
utm_medium: (type - social, guest_post, email)
utm_campaign: (campaign name - seo-boost, brand-awareness)
utm_content: (optional - button text, article title)

Example:
https://batixpro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=seo-launch&utm_content=guide-article
```

### 6.2 UTM Generator Tool
```
Use: https://ga-dev-tools.google/ga4/campaign-url-builder/

Remplissez les champs et copiez l'URL générée.
```

### 6.3 Tracking Your Links

Exemple de 5 liens à tracker:

```
1. Blog Post in Medium (guest post):
   https://batixpro.com/blog/guide-caisse-quincaillerie?utm_source=medium&utm_medium=guest_post&utm_campaign=seo-content

2. LinkedIn Post (company page):
   https://batixpro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=brand-awareness

3. Backlink (backlink site):
   https://batixpro.com/blog?utm_source=quincaillerie-mag&utm_medium=backlink&utm_campaign=pr

4. Email Newsletter:
   https://batixpro.com/?utm_source=email&utm_medium=newsletter&utm_campaign=weekly-tips

5. Twitter Thread:
   https://batixpro.com/?utm_source=twitter&utm_medium=social&utm_campaign=product-launch
```

---

## 📱 Étape 7: Mobile & Conversion Tracking

### 7.1 Setup Conversion en Inertia.js

```javascript
// resources/js/Components/TrialSignupButton.tsx
import { useEffect } from 'react';

export default function TrialSignupButton() {
    const handleClick = () => {
        // Track in Google Analytics
        if (window.gtag) {
            window.gtag('event', 'trial_signup', {
                'event_category': 'conversion',
                'event_label': 'CTA button click',
                'value': 1,
            });
        }
        
        // Redirect
        window.location.href = route('register');
    };

    return (
        <button onClick={handleClick}>
            Démarrer mon essai gratuit
        </button>
    );
}
```

### 7.2 Setup Email Tracking

```html
<!-- Dans email HTML -->
<a href="https://batixpro.com/?utm_source=email&utm_medium=email&utm_campaign=onboarding">
    Start Free Trial
</a>
```

---

## 📊 Étape 8: Monitoring & Reporting

### 8.1 Checker Setup Tous les Jours (1 semaine)

```
Days 1-7:
☐ Vérifier Realtime stats
☐ Tester chaque conversion manuellement
☐ Vérifier UTM parameters dans rapports
☐ Ajuster si necesaire
```

### 8.2 Weekly Report Template

Créer rapport hebdo pour tracker:

| Métrique | Semaine 1 | Semaine 2 | Objectif |
|----------|-----------|-----------|----------|
| Organic Users | ? | ? | 100+ |
| Trial Signups | ? | ? | 5-10 |
| Conversion Rate | ? | ? | 5% |
| Avg Session Duration | ? | ? | 3+ min |
| Pages per Session | ? | ? | 2+ |

### 8.3 Monthly Review (avec équipe)

```
Chaque 1er du mois:
1. Review organic metrics
2. Identify top performing pages
3. Identify opportunities to improve
4. Plan next month's content
5. Adjust budget/resources if needed
```

---

## 🎯 Key Metrics à Monitor

### Top Organic Keywords (après 4-6 semaines)

Aller à:
```
Google Analytics > Traffic > Source / Medium
Filter: source = google
→ Voir quels keywords amènent traffic
```

### Trial Signup Funnel

```
Tracking:
1. Organic visit
2. View page
3. Click CTA
4. Complete signup

Metric: Conversion rate par step
Goal: >5% ultimate conversion
```

### Content Performance

```
Aller à:
Google Analytics > Pages
Sort: Users or Engagement rate

Identifier:
- Best performing pages
- Underperforming pages
- Pages to improve
- Content ideas
```

---

## 🚀 Prochaines Étapes

**Après 1 mois**:
1. Analyser quels pages génèrent conversions
2. Créer plus de contenu dans les catégories gagnantes
3. Améliorer pages sous-performantes

**Après 3 mois**:
1. Setup advanced attribution modeling
2. Integrate with CRM (pipeline tracking)
3. Setup revenue tracking (si payments actifs)

---

## 🔧 Troubleshooting

### "Je ne vois pas de data"
- Vérifier que GA snippet est actif
- Attendre 24-48h après setup
- Vérifier dans Realtime (Google Analytics > Realtime)

### "UTM Parameters ne s'affichent pas"
- Vérifier paramèters dans URL
- Vérifier Google Analytics filters ne bloquent pas
- Attendre 24h pour data

### "Conversions ne tracent pas"
- Vérifier gtag('event', ...) est appelé
- Vérifier browser console pour errors
- Test dans Google Analytics > Test Web Stream

---

## 📞 Resources

- Google Analytics Help: https://support.google.com/analytics
- GA4 Implementation Guide: https://developers.google.com/analytics/devguides/collection/ga4
- Event Builder: https://ga-dev-tools.google/ga4/event-builder/
- UTM Generator: https://ga-dev-tools.google/ga4/campaign-url-builder/

---

**Status**: Ready to implement  
**Timeline**: 1-2 hours for full setup  
**Support**: Ask Claude for specific implementation questions
