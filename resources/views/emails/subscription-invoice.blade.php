<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $invoice->invoice_number }}</title>
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
            background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
            padding: 36px 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .header-left h1 { color: #0f172a; font-size: 24px; font-weight: 800; }
        .header-left p  { color: #1e293b; font-size: 13px; margin-top: 4px; }
        .header-right   { text-align: right; }
        .header-right .inv-num { color: #0f172a; font-size: 13px; font-weight: 700; }
        .header-right .inv-date { color: #374151; font-size: 12px; margin-top: 4px; }
        .content { padding: 36px 30px; }
        .greeting { font-size: 17px; color: #f1f5f9; margin-bottom: 16px; font-weight: 500; }
        .intro { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
        .success-badge {
            display: inline-block;
            background: rgba(52,211,153,0.15);
            border: 1px solid rgba(52,211,153,0.4);
            border-radius: 999px;
            padding: 6px 14px;
            font-size: 13px;
            font-weight: 600;
            color: #34d399;
            margin-bottom: 28px;
        }
        .invoice-box {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 28px;
        }
        .invoice-title {
            padding: 14px 20px;
            background: rgba(252,211,77,0.08);
            border-bottom: 1px solid rgba(255,255,255,0.06);
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #fcd34d;
        }
        .invoice-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            font-size: 14px;
        }
        .invoice-row:last-child { border-bottom: none; }
        .row-label { color: #94a3b8; }
        .row-value { color: #f1f5f9; font-weight: 500; text-align: right; }
        .invoice-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: rgba(252,211,77,0.08);
            border-top: 1px solid rgba(252,211,77,0.2);
        }
        .total-label { color: #fcd34d; font-weight: 700; font-size: 15px; }
        .total-value { color: #fcd34d; font-weight: 800; font-size: 20px; }
        .validity-box {
            background: rgba(99,102,241,0.08);
            border: 1px solid rgba(99,102,241,0.2);
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 28px;
            font-size: 14px;
            color: #a5b4fc;
            line-height: 1.6;
        }
        .validity-box strong { color: #c7d2fe; }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent);
            margin: 24px 0;
        }
        .footer {
            background: rgba(15,23,42,0.5);
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        .footer p { font-size: 12px; color: #475569; line-height: 1.6; margin-bottom: 6px; }
        .footer a { color: #fcd34d; text-decoration: none; }
        @media only screen and (max-width: 600px) {
            body { padding: 20px 10px; }
            .header { flex-direction: column; gap: 12px; }
            .header-right { text-align: left; }
            .content { padding: 24px 20px; }
        }
    </style>
</head>
<body>
<div class="container">

    <div class="header">
        <div class="header-left">
            <h1>{{ config('app.name') }}</h1>
            <p>{{ __('mail.subscription_invoice.header_subtitle') }}</p>
        </div>
        <div class="header-right">
            <div class="inv-num">N° {{ $invoice->invoice_number }}</div>
            <div class="inv-date">{{ $invoice->issued_at->format('d/m/Y') }}</div>
        </div>
    </div>

    <div class="content">
        <p class="greeting">{{ __('mail.subscription_invoice.greeting', ['salutation' => __('mail.common.salutation'), 'name' => $user->name]) }}</p>
        <p class="intro">
            {{ __('mail.subscription_invoice.intro') }}
        </p>

        <div class="success-badge">{{ __('mail.subscription_invoice.payment_confirmed') }}</div>

        <div class="invoice-box">
            <div class="invoice-title">{{ __('mail.subscription_invoice.invoice_details_title') }}</div>

            <div class="invoice-row">
                <span class="row-label">{{ __('mail.subscription_invoice.plan_label') }}</span>
                <span class="row-value">{{ $subscription->plan->name }}</span>
            </div>
            <div class="invoice-row">
                <span class="row-label">{{ __('mail.subscription_invoice.billing_cycle_label') }}</span>
                <span class="row-value">{{ $subscription->billing_cycle === 'yearly' ? __('mail.subscription_invoice.billing_yearly') : __('mail.subscription_invoice.billing_monthly') }}</span>
            </div>
            <div class="invoice-row">
                <span class="row-label">{{ __('mail.subscription_invoice.payment_method_label') }}</span>
                <span class="row-value">Mobile Money ({{ $invoice->payment_method === 'pawapay' ? $invoice->metadata['correspondent'] ?? 'PawaPay' : ucfirst(str_replace('_', ' ', $invoice->payment_method)) }})</span>
            </div>
            @if(!empty($invoice->metadata['msisdn']))
            <div class="invoice-row">
                <span class="row-label">{{ __('mail.subscription_invoice.phone_number_label') }}</span>
                <span class="row-value">+{{ $invoice->metadata['msisdn'] }}</span>
            </div>
            @endif
            <div class="invoice-row">
                <span class="row-label">{{ __('mail.subscription_invoice.payment_date_label') }}</span>
                <span class="row-value">{{ $invoice->paid_at->format('d/m/Y à H:i') }}</span>
            </div>

            <div class="invoice-total">
                <span class="total-label">{{ __('mail.subscription_invoice.total_paid_label') }}</span>
                <span class="total-value">{{ number_format((float) $invoice->total, 0, ',', ' ') }} {{ $subscription->plan->currency ?? 'XOF' }}</span>
            </div>
        </div>

        <div class="validity-box">
            {{ __('mail.subscription_invoice.subscription_active', [
                'planName' => $subscription->plan->name,
                'startDate' => $subscription->started_at->format('d/m/Y'),
                'endDate' => $subscription->expires_at ? __('mail.subscription_invoice.subscription_active_end_date', ['endDate' => $subscription->expires_at->format('d/m/Y')]) : __('mail.subscription_invoice.subscription_active_no_expiry')
            ]) }}
        </div>

        <div class="divider"></div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
            {{ __('mail.subscription_invoice.keep_email') }}<br>
            {{ __('mail.subscription_invoice.questions') }} :
            <a href="mailto:{{ config('mail.from.address') }}" style="color: #fcd34d; text-decoration: none;">{{ config('mail.from.address') }}</a>
        </p>
    </div>

    <div class="footer">
        <p>{{ __('mail.subscription_invoice.footer') }}</p>
        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. {{ __('mail.common.copyright') }}</p>
    </div>

</div>
</body>
</html>
