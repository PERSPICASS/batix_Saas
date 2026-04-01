<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingsController extends Controller
{
    private array $groups = ['payment', 'contact', 'general'];

    public function index(): Response
    {
        return Inertia::render('PlatformAdmin/Settings/Index', [
            'settings' => [
                'general' => [
                    'platform_name'    => PlatformSetting::get('platform_name', 'Batix SaaS'),
                    'support_email'    => PlatformSetting::get('support_email', 'support@batixpro.com'),
                    'support_phone'    => PlatformSetting::get('support_phone', ''),
                    'website_url'      => PlatformSetting::get('website_url', ''),
                ],
                'payment' => [
                    'wave'         => PlatformSetting::get('payment_wave',         config('services.payment.wave', '')),
                    'orange_money' => PlatformSetting::get('payment_orange_money', config('services.payment.orange_money', '')),
                    'mtn_money'    => PlatformSetting::get('payment_mtn_money',    config('services.payment.mtn_money', '')),
                    'moov_money'   => PlatformSetting::get('payment_moov_money',   config('services.payment.moov_money', '')),
                    'virement'     => PlatformSetting::get('payment_virement',     config('services.payment.virement', '')),
                    'carte'        => PlatformSetting::get('payment_carte',        config('services.payment.carte', '')),
                ],
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'general.platform_name' => 'nullable|string|max:100',
            'general.support_email' => 'nullable|email|max:150',
            'general.support_phone' => 'nullable|string|max:30',
            'general.website_url'   => 'nullable|url|max:200',
            'payment.wave'          => 'nullable|string|max:50',
            'payment.orange_money'  => 'nullable|string|max:50',
            'payment.mtn_money'     => 'nullable|string|max:50',
            'payment.moov_money'    => 'nullable|string|max:50',
            'payment.virement'      => 'nullable|string|max:100',
            'payment.carte'         => 'nullable|string|max:100',
        ]);

        foreach ($validated['general'] ?? [] as $key => $value) {
            PlatformSetting::set($key, $value, 'general');
        }

        foreach ($validated['payment'] ?? [] as $key => $value) {
            PlatformSetting::set('payment_' . $key, $value, 'payment');
        }

        return back()->with('success', 'Paramètres mis à jour avec succès.');
    }
}
