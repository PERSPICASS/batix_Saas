<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Renouvellement abonnement</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0f172a;
            color: #e2e8f0;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(to bottom, #1e293b, #0f172a);
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.1);
            overflow: hidden;
        }
        .header {
            background: {{ $daysLeft <= 1 ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)' }};
            padding: 36px 30px;
        }
        .header h1 { color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 4px; }
        .header p  { color: rgba(15,23,42,0.7); font-size: 14px; }
        .body { padding: 32px 30px; }
        .alert-box {
            background: {{ $daysLeft <= 1 ? 'rgba(239,68,68,0.15)' : 'rgba(252,211,77,0.12)' }};
            border: 1px solid {{ $daysLeft <= 1 ? 'rgba(239,68,68,0.35)' : 'rgba(252,211,77,0.3)' }};
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 28px;
            text-align: center;
        }
        .alert-days {
            font-size: 40px;
            font-weight: 900;
            color: {{ $daysLeft <= 1 ? '#f87171' : '#fcd34d' }};
            line-height: 1;
        }
        .alert-label { font-size: 14px; color: #94a3b8; margin-top: 6px; }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 28px;
        }
        .info-item {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 10px;
            padding: 14px 16px;
        }
        .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
        .info-value { font-size: 15px; font-weight: 600; color: #f1f5f9; }
        .message { font-size: 14px; color: #94a3b8; line-height: 1.7; margin-bottom: 28px; }
        .btn {
            display: block;
            background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
            color: #0f172a;
            text-align: center;
            padding: 14px 24px;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            margin-bottom: 28px;
        }
        .footer {
            border-top: 1px solid rgba(255,255,255,0.06);
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #475569;
            line-height: 1.6;
        }
    </style>
</head>
<body>
<div class="container">

    <div class="header">
        <h1>{{ config('app.name') }}</h1>
        <p>{{ __('mail.subscription_expiry.header_subtitle') }}</p>
    </div>

    <div class="body">

        <div class="alert-box">
            @if($daysLeft <= 0)
                <div class="alert-days">!</div>
                <div class="alert-label">{{ __('mail.subscription_expiry.expired') }}</div>
            @elseif($daysLeft === 1)
                <div class="alert-days">1</div>
                <div class="alert-label">{{ __('mail.subscription_expiry.days_left_singular') }}</div>
            @else
                <div class="alert-days">{{ $daysLeft }}</div>
                <div class="alert-label">{{ __('mail.subscription_expiry.days_left_plural') }}</div>
            @endif
        </div>

        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">{{ __('mail.subscription_expiry.plan_label') }}</div>
                <div class="info-value">{{ $subscription->plan?->name ?? '—' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">{{ __('mail.subscription_expiry.expiration_label') }}</div>
                <div class="info-value">{{ $subscription->expires_at?->format('d/m/Y') ?? '—' }}</div>
            </div>
        </div>

        <p class="message">
            {{ __('mail.subscription_expiry.greeting', ['salutation' => __('mail.common.salutation'), 'name' => $user->name]) }}<br><br>
            @if($daysLeft <= 1)
                {{ __('mail.subscription_expiry.expiry_today', ['planName' => $subscription->plan?->name, 'appName' => config('app.name')]) }}
            @else
                {{ __('mail.subscription_expiry.expiry_soon', ['planName' => $subscription->plan?->name, 'days' => $daysLeft]) }}
            @endif
        </p>

        <a href="{{ url('/plans') }}" class="btn">
            {{ __('mail.subscription_expiry.renew_button') }}
        </a>

    </div>

    <div class="footer">
        <p>{{ __('mail.subscription_expiry.footer_header', ['appName' => config('app.name')]) }}</p>
        <p>{{ __('mail.subscription_expiry.footer_message') }}</p>
    </div>

</div>
</body>
</html>
