<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{ $invoice->invoice_number }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #52525b;
        }
        .wrapper { width: 100%; background-color: #f4f4f5; padding: 32px 16px; }
        .content { max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; }
        .inner { padding: 32px; }
        .brand { font-size: 16px; font-weight: 700; color: #18181b; margin: 0 0 24px; }
        h1 { font-size: 18px; font-weight: 700; color: #18181b; margin: 0 0 16px; }
        p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
        .badge {
            display: inline-block;
            font-size: 13px;
            font-weight: 600;
            color: #15803d;
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 999px;
            padding: 4px 12px;
            margin: 0 0 20px;
        }
        table.details { width: 100%; border-collapse: collapse; margin: 0 0 20px; }
        table.details td { padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f0f0f1; }
        table.details td.label { color: #71717a; }
        table.details td.value { color: #18181b; font-weight: 500; text-align: right; }
        table.details tr:last-child td { border-bottom: none; }
        .total-row td { padding-top: 14px; font-size: 16px; }
        .total-row td.label { color: #18181b; font-weight: 700; }
        .total-row td.value { color: #18181b; font-weight: 700; }
        .note { font-size: 13px; color: #71717a; line-height: 1.6; margin: 0 0 8px; }
        .footer { padding: 20px 32px; border-top: 1px solid #f0f0f1; }
        .footer p { font-size: 12px; color: #a1a1aa; margin: 0 0 4px; }
        a { color: #18181b; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="content">
        <div class="inner">
            <p class="brand">{{ config('app.name') }}</p>

            <h1>{{ __('mail.subscription_invoice.payment_confirmed') }}</h1>

            <p>{{ __('mail.subscription_invoice.greeting', ['salutation' => __('mail.common.salutation'), 'name' => $user->name]) }}</p>
            <p>{{ __('mail.subscription_invoice.intro') }}</p>

            <table class="details" role="presentation">
                <tr>
                    <td class="label">{{ __('mail.subscription_invoice.plan_label') }}</td>
                    <td class="value">{{ $subscription->plan->name }}</td>
                </tr>
                <tr>
                    <td class="label">{{ __('mail.subscription_invoice.billing_cycle_label') }}</td>
                    <td class="value">{{ $subscription->billing_cycle === 'yearly' ? __('mail.subscription_invoice.billing_yearly') : __('mail.subscription_invoice.billing_monthly') }}</td>
                </tr>
                <tr>
                    <td class="label">{{ __('mail.subscription_invoice.payment_method_label') }}</td>
                    <td class="value">{{ $invoice->payment_method === 'pawapay' ? ($invoice->metadata['correspondent'] ?? 'PawaPay') : ucfirst(str_replace('_', ' ', $invoice->payment_method)) }}</td>
                </tr>
                @if(!empty($invoice->metadata['msisdn']))
                <tr>
                    <td class="label">{{ __('mail.subscription_invoice.phone_number_label') }}</td>
                    <td class="value">+{{ $invoice->metadata['msisdn'] }}</td>
                </tr>
                @endif
                <tr>
                    <td class="label">{{ __('mail.subscription_invoice.payment_date_label') }}</td>
                    <td class="value">{{ $invoice->paid_at->format('d/m/Y à H:i') }}</td>
                </tr>
                <tr class="total-row">
                    <td class="label">{{ __('mail.subscription_invoice.total_paid_label') }}</td>
                    <td class="value">{{ number_format((float) $invoice->total, 0, ',', ' ') }} FCFA</td>
                </tr>
            </table>

            <p class="note">
                {{ __('mail.subscription_invoice.subscription_active', [
                    'planName' => $subscription->plan->name,
                    'startDate' => $subscription->started_at->format('d/m/Y'),
                    'endDate' => $subscription->expires_at ? __('mail.subscription_invoice.subscription_active_end_date', ['endDate' => $subscription->expires_at->format('d/m/Y')]) : __('mail.subscription_invoice.subscription_active_no_expiry'),
                ]) }}
            </p>
            <p class="note">{{ __('mail.subscription_invoice.keep_email') }}</p>
            <p class="note">
                {{ __('mail.subscription_invoice.questions') }}
                <a href="mailto:{{ config('mail.from.address') }}">{{ config('mail.from.address') }}</a>
            </p>
        </div>
        <div class="footer">
            <p>{{ __('mail.subscription_invoice.footer') }}</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}</p>
        </div>
    </div>
</div>
</body>
</html>
