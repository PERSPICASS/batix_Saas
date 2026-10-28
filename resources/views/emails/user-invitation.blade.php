@php
    $key = $pending ? 'mail.user_invitation' : 'mail.user_invitation.reset';
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __("$key.title", ['shop' => $shop]) }}</title>
</head>
<body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#fcd34d 0%,#f59e0b 100%);padding:28px 30px;">
        <div style="font-size:20px;font-weight:800;color:#0f172a;">{{ config('app.name') }}</div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;margin-top:12px;">{{ __("$key.title", ['shop' => $shop]) }}</div>
    </div>

    <div style="padding:30px;font-size:15px;line-height:1.7;color:#334155;">
        <p style="margin:0 0 16px;">{{ __('mail.user_invitation.greeting', ['name' => $user->name]) }}</p>
        <p style="margin:0 0 16px;">{{ __("$key.body", ['sender' => $sentBy->name, 'shop' => $shop]) }}</p>

        <a href="{{ $url }}" style="display:block;background:#f59e0b;color:#0f172a;text-align:center;padding:14px 24px;border-radius:10px;font-weight:700;text-decoration:none;margin:24px 0;">
            {{ __("$key.cta") }}
        </a>

        <p style="margin:0 0 8px;font-size:13px;color:#64748b;">{{ __('mail.user_invitation.login_hint', ['email' => $user->email]) }}</p>
        <p style="margin:0;font-size:13px;color:#64748b;">{{ __('mail.user_invitation.expiry', ['days' => $days]) }}</p>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding:18px 30px;text-align:center;font-size:12px;color:#64748b;line-height:1.6;">
        <p style="margin:0;">{{ __('mail.user_invitation.footer') }}</p>
    </div>
</div>
</body>
</html>
