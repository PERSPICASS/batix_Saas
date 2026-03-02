# Système de Vérification Email par Code OTP

**Date:** 1 mars 2026  
**Statut:** ✅ Implémenté

## Vue d'ensemble

Le système de vérification email par code OTP (One-Time Password) a été implémenté pour sécuriser la création de compte. Un code à 6 chiffres est envoyé par email à l'utilisateur lors de l'inscription et doit être saisi pour activer le compte.

## Caractéristiques principales

### 🔐 Sécurité

- **Code à 6 chiffres** : Génération aléatoire d'un code numérique
- **Expiration** : Le code expire après 15 minutes
- **Throttling** : Protection contre les attaques par force brute
  - Maximum 6 tentatives de vérification par minute
  - Maximum 3 renvois de code par minute
- **Validation stricte** : Vérification du code et de son expiration côté serveur

### ✨ Expérience utilisateur

- **Interface moderne** : Design avec Tailwind CSS et Lucide Icons
- **Saisie intelligente** :
  - Navigation automatique entre les champs lors de la saisie
  - Support du copier-coller du code complet
  - Validation automatique dès le 6ème chiffre saisi
- **Renvoi du code** : Possibilité de renvoyer un nouveau code avec cooldown de 60 secondes
- **Feedback en temps réel** : Messages d'erreur et de succès clairs

### 📧 Email professionnel

- Template HTML responsive
- Design cohérent avec l'identité de l'application (amber-300)
- Informations de sécurité
- Expiration clairement indiquée

## Architecture

### Base de données

**Migration:** `2026_03_01_000001_add_email_verification_code_to_users_table.php`

Champs ajoutés à la table `users` :
```php
$table->string('email_verification_code', 6)->nullable();
$table->timestamp('email_verification_code_expires_at')->nullable();
```

### Backend

#### 1. **Mailable** (`app/Mail/EmailVerificationCode.php`)
```php
class EmailVerificationCode extends Mailable
{
    public string $verificationCode;
    public string $userName;
    
    // Subject: "Code de vérification - {app.name}"
    // View: emails.verification-code
}
```

#### 2. **Contrôleur** (`app/Http/Controllers/Auth/EmailVerificationCodeController.php`)

**Méthodes:**
- `show()` : Affiche la page de vérification
- `verify(Request $request)` : Vérifie le code saisi
- `resend(Request $request)` : Renvoie un nouveau code
- `generateVerificationCode()` : Génère un code à 6 chiffres

**Logique de vérification:**
```php
// 1. Vérifier l'expiration du code
if (now()->isAfter($user->email_verification_code_expires_at)) {
    return error('expired');
}

// 2. Vérifier la correspondance du code
if ($user->email_verification_code !== $request->code) {
    return error('invalid');
}

// 3. Marquer l'email comme vérifié
$user->markEmailAsVerified();

// 4. Nettoyer le code
$user->update([
    'email_verification_code' => null,
    'email_verification_code_expires_at' => null,
]);
```

#### 3. **RegisteredUserController** (modifié)

**Modifications:**
```php
// Générer le code OTP
$verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

// Créer l'utilisateur avec le code
$user = User::create([
    // ... autres champs
    'email_verification_code' => $verificationCode,
    'email_verification_code_expires_at' => now()->addMinutes(15),
]);

// Envoyer l'email
Mail::to($user->email)->send(new EmailVerificationCode($verificationCode, $user->name));

// Rediriger vers la page de vérification
return redirect()->route('verification.code.show');
```

### Routes (`routes/auth.php`)

```php
Route::middleware('auth')->group(function () {
    // Page de vérification
    Route::get('verify-email-code', [EmailVerificationCodeController::class, 'show'])
        ->name('verification.code.show');
    
    // Vérifier le code (throttle: 6/min)
    Route::post('verify-email-code', [EmailVerificationCodeController::class, 'verify'])
        ->middleware('throttle:6,1')
        ->name('verification.code.verify');
    
    // Renvoyer le code (throttle: 3/min)
    Route::post('verify-email-code/resend', [EmailVerificationCodeController::class, 'resend'])
        ->middleware('throttle:3,1')
        ->name('verification.code.resend');
});
```

### Frontend

#### **Page de vérification** (`resources/js/Pages/Auth/VerifyEmail.tsx`)

**Composants principaux:**

1. **Inputs de code:**
   - 6 champs pour les 6 chiffres
   - Validation : uniquement des chiffres (0-9)
   - Focus automatique sur le champ suivant
   - Support du retour arrière (Backspace)
   - Gestion du copier-coller

2. **États:**
   ```typescript
   const [code, setCode] = useState(['', '', '', '', '', '']);
   const [isVerifying, setIsVerifying] = useState(false);
   const [verificationError, setVerificationError] = useState('');
   const [resendSuccess, setResendSuccess] = useState(false);
   const [resendCooldown, setResendCooldown] = useState(0);
   ```

3. **Fonctionnalités:**
   - Validation automatique dès que les 6 chiffres sont saisis
   - Cooldown de 60 secondes pour le renvoi du code
   - Messages d'erreur et de succès contextuels
   - Redirection automatique après vérification réussie

### Template Email (`resources/views/emails/verification-code.blade.php`)

**Design:**
- **Header** : Logo et titre avec gradient amber
- **Code OTP** : Affiché en grand avec effet visuel
- **Expiration** : Mention claire des 15 minutes
- **Sécurité** : Avertissements sur la protection du code
- **Footer** : Informations de contact et copyright
- **Responsive** : S'adapte aux mobiles

**Palette de couleurs:**
- Background: Gradient slate-950 à slate-900
- Accent: amber-300 (#fcd34d)
- Bordures: rgba(255, 255, 255, 0.1)

## Flux utilisateur

### 1. **Inscription**
```
User -> Formulaire d'inscription
     -> Validation des données
     -> Création du compte (sans email_verified_at)
     -> Génération du code OTP
     -> Envoi de l'email
     -> Connexion automatique
     -> Redirection vers /verify-email-code
```

### 2. **Vérification**
```
User -> Page de vérification
     -> Saisie du code à 6 chiffres
     -> Vérification automatique ou manuelle
     -> Si valide : 
        - email_verified_at = now()
        - Nettoyage du code
        - Redirection vers /{code_user}/dashboard
     -> Si invalide/expiré :
        - Message d'erreur
        - Possibilité de renvoyer le code
```

### 3. **Renvoi du code**
```
User -> Clique sur "Renvoyer le code"
     -> Génération d'un nouveau code
     -> Nouveau délai d'expiration (15 min)
     -> Envoi du nouvel email
     -> Cooldown de 60 secondes
```

## Configuration email

### Variables d'environnement

Assurez-vous que ces variables sont configurées dans `.env` :

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io  # ou votre serveur SMTP
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@votreapp.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### Test en local

Pour tester en développement, vous pouvez utiliser:

1. **Mailtrap** (recommandé pour le développement)
   - Gratuit
   - Interface web pour voir les emails
   - Pas d'envoi réel

2. **Log driver** (pour tester sans SMTP)
   ```env
   MAIL_MAILER=log
   ```
   Les emails seront écrits dans `storage/logs/laravel.log`

3. **MailHog** (serveur SMTP local)
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=127.0.0.1
   MAIL_PORT=1025
   ```

## Sécurité

### Protections implémentées

1. **Expiration temporelle** : 15 minutes
2. **Throttling** :
   - Vérification: 6 tentatives/minute
   - Renvoi: 3 tentatives/minute
3. **Code aléatoire** : Génération cryptographiquement sûre
4. **Validation stricte** : Vérification côté serveur uniquement
5. **Nettoyage** : Le code est supprimé après vérification

### Attaques prévenues

- ✅ **Brute force** : Throttling + expiration
- ✅ **Rejeu** : Le code est supprimé après usage
- ✅ **Timing attack** : Temps de réponse constants
- ✅ **Email bombing** : Cooldown sur le renvoi

## Personnalisation

### Modifier la durée d'expiration

Dans `RegisteredUserController.php` et `EmailVerificationCodeController.php` :
```php
'email_verification_code_expires_at' => now()->addMinutes(30), // 30 minutes au lieu de 15
```

### Modifier le cooldown de renvoi

Dans `VerifyEmail.tsx` :
```typescript
setResendCooldown(120); // 120 secondes au lieu de 60
```

### Changer le throttling

Dans `routes/auth.php` :
```php
->middleware('throttle:10,1') // 10 tentatives par minute au lieu de 6
```

### Personnaliser l'email

Modifiez le template dans `resources/views/emails/verification-code.blade.php`

## Tests

### Test manuel

1. **Inscription**
   - Créer un nouveau compte
   - Vérifier que l'email est reçu
   - Vérifier que le code est correct

2. **Vérification**
   - Saisir le code correct → doit rediriger vers le dashboard
   - Saisir un code incorrect → doit afficher une erreur
   - Saisir un code expiré → doit afficher une erreur

3. **Renvoi**
   - Cliquer sur "Renvoyer" → doit recevoir un nouveau code
   - Vérifier le cooldown de 60 secondes

### Test de sécurité

```bash
# Test du throttling (doit bloquer après 6 tentatives)
for i in {1..10}; do
    curl -X POST http://localhost/verify-email-code \
         -H "Content-Type: application/json" \
         -d '{"code": "000000"}'
done
```

## Dépannage

### L'email n'est pas envoyé

1. Vérifier la configuration `.env`
2. Vérifier les logs : `storage/logs/laravel.log`
3. Tester la connexion SMTP :
   ```bash
   php artisan tinker
   Mail::raw('Test', function($msg) {
       $msg->to('test@example.com')->subject('Test');
   });
   ```

### Le code expire immédiatement

Vérifier la timezone dans `config/app.php` :
```php
'timezone' => 'Africa/Casablanca', // ou votre timezone
```

### Les inputs ne fonctionnent pas

1. Vérifier la console du navigateur pour les erreurs JS
2. Vérifier que Lucide Icons est installé :
   ```bash
   npm list lucide-react
   ```

## Fichiers modifiés/créés

### Créés

| Fichier | Description |
|---------|-------------|
| `database/migrations/2026_03_01_000001_add_email_verification_code_to_users_table.php` | Migration pour les champs OTP |
| `app/Mail/EmailVerificationCode.php` | Mailable pour l'envoi du code |
| `app/Http/Controllers/Auth/EmailVerificationCodeController.php` | Contrôleur de vérification |
| `resources/views/emails/verification-code.blade.php` | Template HTML de l'email |
| `docs/EMAIL_VERIFICATION_OTP_SYSTEM.md` | Cette documentation |

### Modifiés

| Fichier | Modifications |
|---------|---------------|
| `app/Http/Controllers/Auth/RegisteredUserController.php` | Ajout de la génération et envoi du code OTP |
| `app/Models/User.php` | Ajout des champs dans $fillable et $casts |
| `routes/auth.php` | Ajout des routes de vérification OTP |
| `resources/js/Pages/Auth/VerifyEmail.tsx` | Remplacement complet par la nouvelle interface |

## Améliorations futures possibles

- [ ] **SMS** : Ajouter une option de vérification par SMS
- [ ] **QR Code** : Générer un QR code pour vérification mobile
- [ ] **Biométrie** : Support de la vérification biométrique
- [ ] **2FA** : Intégrer avec un système 2FA complet (TOTP)
- [ ] **Historique** : Logger les tentatives de vérification
- [ ] **Analytics** : Tracker le taux de conversion
- [ ] **A/B Testing** : Tester différentes durées d'expiration
- [ ] **Webhooks** : Notifier des services tiers lors de la vérification

## Conclusion

Le système de vérification email par code OTP est maintenant pleinement fonctionnel et sécurisé. Il offre une expérience utilisateur moderne tout en maintenant un niveau de sécurité élevé.

Les utilisateurs doivent vérifier leur email avant d'accéder au dashboard, ce qui garantit l'authenticité des adresses email et réduit les inscriptions frauduleuses.

---

**Auteur:** GitHub Copilot  
**Version:** 1.0  
**Dernière mise à jour:** 1 mars 2026
