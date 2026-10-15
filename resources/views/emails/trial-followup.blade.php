@php
    $key = "mail.trial_followup.steps.{$step}";
    // **gras** dans les textes de traduction, après échappement du contenu.
    $rich = fn (string $text) => preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', e($text));
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __("$key.title") }}</title>
</head>
<body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#fcd34d 0%,#f59e0b 100%);padding:28px 30px;">
        <div style="font-size:20px;font-weight:800;color:#0f172a;">{{ config('app.name') }}</div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;margin-top:12px;">{{ __("$key.title") }}</div>
    </div>

    <div style="padding:30px;font-size:15px;line-height:1.7;color:#334155;">
        <p style="margin:0 0 16px;">{{ __('mail.trial_followup.greeting', ['name' => $user->name]) }}</p>
        <p style="margin:0 0 16px;">{{ __("$key.body") }}</p>

        @if ($productsCount > 0 || $salesCount > 0)
            <p style="margin:0 0 24px;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
                {!! $rich(__('mail.trial_followup.your_activity', ['products' => $productsCount, 'sales' => $salesCount])) !!}
            </p>
        @endif

        <a href="{{ $plansUrl }}" style="display:block;background:#f59e0b;color:#0f172a;text-align:center;padding:14px 24px;border-radius:10px;font-weight:700;text-decoration:none;margin-bottom:14px;">
            {{ __('mail.trial_followup.cta') }}
        </a>

        @if ($step === 7)
            <a href="{{ $whatsappUrl }}" style="display:block;background:#16a34a;color:#ffffff;text-align:center;padding:12px 24px;border-radius:10px;font-weight:600;text-decoration:none;">
                {{ __('mail.trial_followup.help_cta') }}
            </a>
        @endif
    </div>

    <div style="border-top:1px solid #e2e8f0;padding:18px 30px;text-align:center;font-size:12px;color:#64748b;line-height:1.6;">
        <p style="margin:0;">{{ __('mail.trial_followup.footer', ['appName' => config('app.name')]) }}</p>
        <p style="margin:6px 0 0;"><a href="{{ $unsubscribeUrl }}" style="color:#64748b;">{{ __('mail.trial_followup.unsubscribe') }}</a></p>
    </div>
</div>
</body>
</html>
