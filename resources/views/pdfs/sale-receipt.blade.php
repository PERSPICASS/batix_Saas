<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reçu de vente {{ $sale->ticket_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            color: #333;
            font-size: 12px;
        }
        .container {
            max-width: 200mm;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        .header p {
            font-size: 10px;
            color: #666;
        }
        .ticket-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 11px;
        }
        .customer-info {
            margin-bottom: 15px;
            font-size: 11px;
        }
        .customer-info strong {
            display: block;
            margin-bottom: 3px;
        }
        table {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: collapse;
        }
        table thead {
            border-top: 1px solid #333;
            border-bottom: 1px solid #333;
        }
        table th {
            padding: 5px 3px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
        }
        table td {
            padding: 5px 3px;
            border-bottom: 1px solid #eee;
            font-size: 10px;
        }
        table tr.total-row td {
            border-top: 1px solid #333;
            border-bottom: 2px solid #333;
            font-weight: bold;
            padding: 8px 3px;
        }
        .summary {
            margin-top: 15px;
            font-size: 11px;
        }
        .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .summary-item.total {
            font-weight: bold;
            font-size: 12px;
            border-top: 1px solid #333;
            border-bottom: 2px solid #333;
            padding: 8px 0;
        }
        .payment-info {
            margin-top: 15px;
            font-size: 10px;
            border-top: 1px solid #333;
            padding-top: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 9px;
            color: #666;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
        }
        .status-completed {
            background-color: #d4edda;
            color: #155724;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .text-right {
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>{{ $sale->shop->name }}</h1>
            <p>{{ $sale->shop->address ?? '' }}</p>
            <p>Tél: {{ $sale->shop->phone ?? 'N/A' }}</p>
        </div>

        <!-- Title -->
        <h2 style="text-align: center; font-size: 14px; margin-bottom: 15px;">
            {{ $sale->status === 'pending' ? 'BON DE CRÉDIT' : 'REÇU DE VENTE' }}
        </h2>

        <!-- Ticket Info -->
        <div class="ticket-info">
            <div>
                <strong>Numéro:</strong> {{ $sale->ticket_number }}<br>
                <strong>Date:</strong> {{ $sale->sale_date->format('d/m/Y H:i') }}<br>
                <strong>Vendeur:</strong> {{ $sale->user->name }}
            </div>
            <div style="text-align: right;">
                <span class="status-badge status-{{ $sale->status }}">
                    {{ $sale->status === 'completed' ? 'PAYÉE' : 'CRÉDIT' }}
                </span>
            </div>
        </div>

        <!-- Customer Info -->
        @if ($sale->customer)
            <div class="customer-info">
                <strong>Client:</strong> {{ $sale->customer->name }}<br>
                @if ($sale->customer->phone)
                    <strong>Tél:</strong> {{ $sale->customer->phone }}
                @endif
            </div>
        @endif

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th>Produit</th>
                    <th style="text-align: center;">Qté</th>
                    <th style="text-align: right;">Prix U.</th>
                    <th style="text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($sale->items as $item)
                    <tr>
                        <td>{{ $item->product_name }}</td>
                        <td style="text-align: center;">{{ $item->quantity }}</td>
                        <td style="text-align: right;">{{ number_format($item->unit_price, 0, ',', ' ') }}</td>
                        <td style="text-align: right;">{{ number_format($item->quantity * $item->unit_price, 0, ',', ' ') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Summary -->
        <div class="summary">
            <div class="summary-item">
                <span>Sous-total:</span>
                <span class="text-right">{{ number_format($sale->subtotal, 0, ',', ' ') }} FCFA</span>
            </div>
            @if ($sale->tax_amount > 0)
                <div class="summary-item">
                    <span>Taxes:</span>
                    <span class="text-right">{{ number_format($sale->tax_amount, 0, ',', ' ') }} FCFA</span>
                </div>
            @endif
            @if ($sale->discount_amount > 0)
                <div class="summary-item">
                    <span>Remise:</span>
                    <span class="text-right">-{{ number_format($sale->discount_amount, 0, ',', ' ') }} FCFA</span>
                </div>
            @endif
            <div class="summary-item total">
                <span>TOTAL:</span>
                <span class="text-right">{{ number_format($sale->total, 0, ',', ' ') }} FCFA</span>
            </div>
        </div>

        <!-- Payment Info -->
        <div class="payment-info">
            <strong>Paiement:</strong><br>
            Méthode: <strong>{{ ucfirst(str_replace('_', ' ', $sale->payment_method)) }}</strong><br>
            Montant payé: <strong>{{ number_format($sale->amount_paid, 0, ',', ' ') }} FCFA</strong><br>
            @if ($sale->remaining_amount > 0)
                <span style="color: #d32f2f;">Reste dû: {{ number_format($sale->remaining_amount, 0, ',', ' ') }} FCFA</span><br>
                @if ($sale->credit_due_date)
                    <span>Échéance: {{ $sale->credit_due_date->format('d/m/Y') }}</span>
                @endif
            @else
                Monnaie rendue: <strong>{{ number_format($sale->change_amount, 0, ',', ' ') }} FCFA</strong>
            @endif
        </div>

        @if ($sale->notes)
            <div style="margin-top: 15px; padding: 10px; background-color: #f5f5f5; border-left: 3px solid #ddd; font-size: 10px;">
                <strong>Notes:</strong><br>
                {{ $sale->notes }}
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Merci pour votre achat!</p>
            <p style="margin-top: 10px; color: #999;">Édité le {{ now()->format('d/m/Y H:i') }}</p>
        </div>
    </div>
</body>
</html>
