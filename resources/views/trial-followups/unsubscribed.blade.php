<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>{{ __('mail.trial_followup.unsubscribed_title') }} — {{ config('app.name') }}</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:480px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;text-align:center;">
        <div style="font-weight:800;font-size:18px;">{{ config('app.name') }}</div>
        <h1 style="font-size:20px;margin:16px 0 8px;">{{ __('mail.trial_followup.unsubscribed_title') }}</h1>
        <p style="color:#475569;line-height:1.6;margin:0;">{{ __('mail.trial_followup.unsubscribed_body') }}</p>
    </div>
</body>
</html>
