@php
    // **gras** dans les textes de traduction, après échappement du contenu.
    $rich = fn (string $text) => preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', e($text));
    $money = fn (float $amount, ?string $currency) => number_format($amount, 0, ',', ' ').' '.get_currency_symbol($currency);
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __('mail.daily_alerts.title') }}</title>
</head>
<body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#fcd34d 0%,#f59e0b 100%);padding:28px 30px;">
        <div style="font-size:20px;font-weight:800;color:#0f172a;">{{ config('app.name') }}</div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;margin-top:12px;">{{ __('mail.daily_alerts.title') }}</div>
    </div>

    <div style="padding:30px;font-size:15px;line-height:1.7;color:#334155;">
        <p style="margin:0 0 8px;">{{ __('mail.daily_alerts.greeting', ['name' => $user->name]) }}</p>
        <p style="margin:0 0 20px;">{{ __('mail.daily_alerts.intro') }}</p>

        @foreach ($digest['shops'] as $shop)
            <div style="margin:0 0 16px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:10px;">
                <div style="font-weight:700;color:#0f172a;margin-bottom:6px;">{{ $shop['name'] }}</div>
                <ul style="margin:0;padding-left:18px;">
                    @isset($shop['alerts']['revenue_drop'])
                        @php($drop = $shop['alerts']['revenue_drop'])
                        <li>{!! $rich(__('mail.daily_alerts.revenue_drop', ['recent' => $money($drop['recent'], $shop['currency']), 'before' => $money($drop['before'], $shop['currency']), 'change' => $drop['change']])) !!}</li>
                    @endisset
                    @isset($shop['alerts']['overdue'])
                        <li>{!! $rich(__('mail.daily_alerts.overdue', ['count' => $shop['alerts']['overdue']['count'], 'owed' => $money($shop['alerts']['overdue']['owed'], $shop['currency'])])) !!}</li>
                    @endisset
                    {{-- Chaque chiffre seulement s'il n'est pas nul : « 0 en rupture » n'apprend rien. --}}
                    @if (($shop['alerts']['stock']['out_of_stock'] ?? 0) > 0)
                        <li>{!! $rich(__('mail.daily_alerts.stock_out', ['count' => $shop['alerts']['stock']['out_of_stock']])) !!}</li>
                    @endif
                    @if (($shop['alerts']['stock']['low'] ?? 0) > 0)
                        <li>{{ __('mail.daily_alerts.stock_low', ['count' => $shop['alerts']['stock']['low']]) }}</li>
                    @endif
                </ul>
            </div>
        @endforeach

        @if (! empty($digest['transfers']))
            <div style="margin:0 0 16px;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
                <div style="font-weight:700;color:#0f172a;margin-bottom:6px;">{{ __('mail.daily_alerts.transfers_title') }}</div>
                <ul style="margin:0;padding-left:18px;">
                    @foreach ($digest['transfers'] as $transfer)
                        <li>{{ __('mail.daily_alerts.transfer', $transfer) }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <a href="{{ $overviewUrl }}" style="display:block;background:#f59e0b;color:#0f172a;text-align:center;padding:14px 24px;border-radius:10px;font-weight:700;text-decoration:none;margin-top:8px;">
            {{ __('mail.daily_alerts.cta') }}
        </a>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding:18px 30px;text-align:center;font-size:12px;color:#64748b;line-height:1.6;">
        <p style="margin:0;">{{ __('mail.daily_alerts.footer', ['appName' => config('app.name')]) }}</p>
        <p style="margin:6px 0 0;"><a href="{{ $unsubscribeUrl }}" style="color:#64748b;">{{ __('mail.daily_alerts.unsubscribe') }}</a></p>
    </div>
</div>
</body>
</html>
