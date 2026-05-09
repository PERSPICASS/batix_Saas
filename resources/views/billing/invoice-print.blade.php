<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="alternate icon" href="/favicon.ico">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
            color: #1e293b;
            background: #fff;
            padding: 0;
        }

        .page {
            max-width: 720px;
            margin: 0 auto;
            padding: 48px 40px;
        }

        /* ── Header ── */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 28px;
            border-bottom: 2px solid #f1f5f9;
        }
        .brand-name {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .brand-sub {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 2px;
        }
        .invoice-meta { text-align: right; }
        .invoice-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #94a3b8;
            margin-bottom: 4px;
        }
        .invoice-number {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
        }
        .invoice-date {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
        }

        /* ── Status badge ── */
        .status-paid {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 4px 12px;
            border-radius: 999px;
            margin-top: 8px;
        }

        /* ── Parties ── */
        .parties {
            display: flex;
            gap: 40px;
            margin-bottom: 36px;
        }
        .party { flex: 1; }
        .party-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #94a3b8;
            margin-bottom: 8px;
        }
        .party-name {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 3px;
        }
        .party-detail {
            font-size: 12px;
            color: #64748b;
            line-height: 1.6;
        }

        /* ── Table ── */
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 28px;
        }
        .invoice-table thead tr {
            background: #f8fafc;
        }
        .invoice-table th {
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            padding: 10px 14px;
            border-bottom: 1px solid #e2e8f0;
        }
        .invoice-table th:last-child { text-align: right; }
        .invoice-table td {
            padding: 14px 14px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            vertical-align: top;
        }
        .invoice-table td:last-child { text-align: right; font-weight: 600; }
        .item-name { font-weight: 600; color: #0f172a; }
        .item-desc { font-size: 11px; color: #94a3b8; margin-top: 2px; }

        /* ── Totals ── */
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 36px;
        }
        .totals-box { width: 260px; }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            color: #475569;
            border-bottom: 1px solid #f1f5f9;
        }
        .totals-row.total {
            padding: 12px 0 0;
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: none;
        }

        /* ── Payment info ── */
        .payment-info {
            background: #f8fafc;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 36px;
        }
        .payment-info-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            margin-bottom: 10px;
        }
        .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 24px;
        }
        .payment-item-label { font-size: 11px; color: #94a3b8; margin-bottom: 1px; }
        .payment-item-value { font-size: 13px; font-weight: 500; color: #0f172a; }

        /* ── Validity ── */
        .validity {
            background: #eff6ff;
            border-left: 3px solid #3b82f6;
            border-radius: 0 8px 8px 0;
            padding: 12px 16px;
            margin-bottom: 36px;
            font-size: 12px;
            color: #1e40af;
        }

        /* ── Footer ── */
        .footer {
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.7;
        }

        /* ── Print button (hidden when printing) ── */
        .print-bar {
            position: fixed;
            top: 0; left: 0; right: 0;
            background: #0f172a;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 100;
        }
        .print-bar span { color: #94a3b8; font-size: 13px; }
        .btn-print {
            background: #fcd34d;
            color: #0f172a;
            border: none;
            padding: 8px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
        }
        .btn-print:hover { background: #fbbf24; }

        @media print {
            .print-bar { display: none !important; }
            body { padding: 0; }
            .page { padding: 32px 28px; }
        }

        body { padding-top: 52px; }
        @media print { body { padding-top: 0; } }
    </style>
</head>
<body>

<div class="print-bar">
    <span>Facture {{ $invoice->invoice_number }}</span>
    <button class="btn-print" onclick="window.print()">⬇ Télécharger / Imprimer</button>
</div>

<div class="page">

    {{-- Header --}}
    <div class="header">
        <div>
            <div class="brand-name">{{ config('app.name') }}</div>
            <div class="brand-sub">Gestion moderne des quincailleries</div>
        </div>
        <div class="invoice-meta">
            <div class="invoice-label">Facture</div>
            <div class="invoice-number">{{ $invoice->invoice_number }}</div>
            <div class="invoice-date">Émise le {{ $invoice->issued_at?->format('d/m/Y') ?? '—' }}</div>
            <div><span class="status-paid">✓ Payée</span></div>
        </div>
    </div>

    {{-- Parties --}}
    <div class="parties">
        <div class="party">
            <div class="party-label">De</div>
            <div class="party-name">{{ config('app.name') }}</div>
            <div class="party-detail">
                support@batixpro.com<br>
                batixpro.com
            </div>
        </div>
        <div class="party">
            <div class="party-label">Facturé à</div>
            <div class="party-name">{{ $invoice->user->name }}</div>
            <div class="party-detail">{{ $invoice->user->email }}</div>
        </div>
    </div>

    {{-- Table --}}
    <table class="invoice-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Période</th>
                <th>Montant</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <div class="item-name">Abonnement {{ $invoice->subscription?->plan?->name ?? '—' }}</div>
                    <div class="item-desc">
                        {{ $invoice->subscription?->billing_cycle === 'yearly' ? 'Facturation annuelle' : 'Facturation mensuelle' }}
                    </div>
                </td>
                <td>
                    @if($invoice->subscription?->started_at && $invoice->subscription?->expires_at)
                        {{ $invoice->subscription->started_at->format('d/m/Y') }}
                        → {{ $invoice->subscription->expires_at->format('d/m/Y') }}
                    @else
                        —
                    @endif
                </td>
                <td>{{ number_format((float) $invoice->amount, 0, ',', ' ') }} {{ 'XOF' }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Totals --}}
    <div class="totals">
        <div class="totals-box">
            <div class="totals-row">
                <span>Sous-total</span>
                <span>{{ number_format((float) $invoice->amount, 0, ',', ' ') }} XOF</span>
            </div>
            <div class="totals-row">
                <span>Taxes</span>
                <span>{{ number_format((float) $invoice->tax, 0, ',', ' ') }} XOF</span>
            </div>
            <div class="totals-row total">
                <span>Total</span>
                <span>{{ number_format((float) $invoice->total, 0, ',', ' ') }} XOF</span>
            </div>
        </div>
    </div>

    {{-- Infos paiement --}}
    <div class="payment-info">
        <div class="payment-info-title">Informations de paiement</div>
        <div class="payment-grid">
            <div>
                <div class="payment-item-label">Méthode</div>
                <div class="payment-item-value">
                    {{ $invoice->payment_method === 'pawapay'
                        ? ($invoice->metadata['correspondent'] ?? 'Mobile Money')
                        : ucfirst(str_replace('_', ' ', $invoice->payment_method)) }}
                </div>
            </div>
            @if(!empty($invoice->metadata['msisdn']))
            <div>
                <div class="payment-item-label">Numéro</div>
                <div class="payment-item-value">+{{ $invoice->metadata['msisdn'] }}</div>
            </div>
            @endif
            <div>
                <div class="payment-item-label">Date de paiement</div>
                <div class="payment-item-value">{{ $invoice->paid_at?->format('d/m/Y') ?? '—' }}</div>
            </div>
            <div>
                <div class="payment-item-label">Statut</div>
                <div class="payment-item-value">✓ Payée</div>
            </div>
        </div>
    </div>

    {{-- Validity --}}
    @if($invoice->subscription?->expires_at)
    <div class="validity">
        Votre abonnement <strong>{{ $invoice->subscription->plan?->name }}</strong> est valide
        du <strong>{{ $invoice->subscription->started_at?->format('d/m/Y') }}</strong>
        au <strong>{{ $invoice->subscription->expires_at->format('d/m/Y') }}</strong>.
    </div>
    @endif

    {{-- Footer --}}
    <div class="footer">
        <p>{{ config('app.name') }} — Ce document fait office de facture officielle.</p>
        <p>Pour toute question : support@batixpro.com</p>
    </div>

</div>
</body>
</html>
