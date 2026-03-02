<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Mail\EmailVerificationCode;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'shop_name' => 'required|string|max:255',
            'shop_address' => 'nullable|string|max:255',
            'shop_city' => 'nullable|string|max:255',
            'shop_postal_code' => 'nullable|string|max:20',
            'shop_phone' => 'nullable|string|max:20',
        ]);

        // Générer un code de vérification à 6 chiffres
        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Créer l'utilisateur avec le rôle super_admin
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'super_admin',
            'is_active' => true,
            'email_verification_code' => $verificationCode,
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ]);

        // Créer la première boutique de l'utilisateur
        $shop = $user->shops()->create([
            'name' => $request->shop_name,
            'address' => $request->shop_address,
            'city' => $request->shop_city,
            'postal_code' => $request->shop_postal_code,
            'phone' => $request->shop_phone,
            'currency' => 'USD',
            'country' => 'Maroc',
        ]);

        // Associer l'utilisateur à la boutique créée
        $user->update(['shop_id' => $shop->id]);

        // Donner toutes les permissions sur tous les modules au super_admin
        $modules = ['shops', 'products', 'categories', 'stocks', 'inventory', 'sales', 'suppliers', 'customers', 'invoices', 'users', 'reports'];
        foreach ($modules as $module) {
            $user->permissions()->create([
                'module' => $module,
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ]);
        }

        // ✨ Attribuer automatiquement le plan FREE (30 jours)
        $freePlan = SubscriptionPlan::where('slug', 'free')->first();
        
        if ($freePlan) {
            Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $freePlan->id,
                'status' => 'trial',
                'amount' => 0, // Plan gratuit
                'started_at' => now(),
                'expires_at' => now()->addDays(30), // 30 jours d'essai gratuit
            ]);
        }

        // Envoyer l'email de vérification avec le code OTP
        Mail::to($user->email)->send(new EmailVerificationCode($verificationCode, $user->name));

        event(new Registered($user));

        Auth::login($user);

        // Définir la boutique active en session
        session(['active_shop_id' => $shop->id]);

        // Rediriger vers la page de vérification email
        return redirect()->route('verification.code.show');
    }
}
