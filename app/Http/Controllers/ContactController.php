<?php

namespace App\Http\Controllers;

use App\Mail\ContactFormMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class ContactController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        // Rate limit : 10 envois / heure par IP
        $key = 'contact:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 10)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = ceil($seconds / 60);
            return response()->json([
                'message' => "Trop de tentatives. Réessayez dans {$minutes} minutes.",
            ], 429);
        }
        RateLimiter::hit($key, 3600);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'min:2', 'max:100'],
            'email'    => ['required', 'email', 'max:150'],
            'subject'  => ['required', 'string', 'min:3', 'max:150'],
            'message'  => ['required', 'string', 'min:10', 'max:2000'],
            'honeypot' => ['present', 'max:0'], // anti-spam
        ], [
            'name.required'    => 'Votre nom est requis.',
            'name.min'         => 'Le nom doit faire au moins 2 caractères.',
            'email.required'   => 'Votre email est requis.',
            'email.email'      => 'Adresse email invalide.',
            'subject.required' => 'Le sujet est requis.',
            'subject.min'      => 'Le sujet doit faire au moins 3 caractères.',
            'message.required' => 'Votre message est requis.',
            'message.min'      => 'Le message doit faire au moins 10 caractères.',
            'honeypot.max'     => 'Spam détecté.',
        ]);

        $to = config('mail.contact_to', config('mail.from.address', 'contact@batixpro.com'));

        Mail::to($to)->send(new ContactFormMail(
            $validated['name'],
            $validated['email'],
            $validated['subject'],
            $validated['message'],
        ));

        return response()->json(['message' => 'Message envoyé avec succès.'], 200);
    }
}
