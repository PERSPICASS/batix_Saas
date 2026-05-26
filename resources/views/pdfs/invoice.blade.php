<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            color: #333;
            font-size: 11px;
        }
        .container {
            max-width: 210mm;
            padding: 20px;
        }
        .header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .company-info h1 {
            font-size: 20px;
            margin-bottom: 10px;
        }
        .company-info p {
            font-size: 10px;
            color: #666;
            margin-bottom: 3px;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-info h2 {
            font-size: 16px;
            margin-bottom: 15px;
            color: #1a1a1a;
        }
        .invoice-detail {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 10px;
        }
        .customer-section {
            margin-bottom: 30px;
        }
        .customer-section h3 {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #666;
        }
        .customer-section p {
            font-size: 11px;
            margin-bottom: 3px;
        }
        table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        table thead {
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
            background-color: #f9f9f9;
        }
        table th {
            padding: 10px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
        }
        table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        table tbody tr:hover {
            background-color: #f5f5f5;
        }
        .totals {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
        }
        .totals-right {
            border: 1px solid #ddd;
            padding: 15px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11px;
        }
        .total-row.final {
            border-top: 2px solid #333;
            padding-top: 8px;
            font-weight: bold;
            font-size: 13px;
        }
        .payment-terms {
            background-color: #f5f5f5;
            padding: 15px;
            margin-bottom: 20px;
        }
        .payment-terms h3 {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .payment-terms p {
            font-size: 10px;
            margin-bottom: 5px;
        }
        .footer {
            border-top: 1px solid #ddd;
            padding-top: 15px;
            text-align: center;
            font-size: 9px;
            color: #666;
        }
        .text-right {
            text-align: right;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>{{ $invoice->shop->name }}</h1>
                <p>{{ $invoice->shop->address ?? '' }}</p>
                <p>Tél: {{ $invoice->shop->phone ?? '' }}</p>
                <p>Email: {{ $invoice->shop->email ?? '' }}</p>
            </div>
            <div class="invoice-info">
                <h2>FACTURE</h2>
                <div class="invoice-detail">
                    <span>Numéro:</span>
                    <span><strong>{{ $invoice->invoice_number }}</strong></span>
                </div>
                <div class="invoice-detail">
                    <span>Date:</span>
                    <span><strong>{{ $invoice->created_at->format('d/m/Y') }}</strong></span>
                </div>
                <div class="invoice-detail">
                    <span>Statut:</span>
                    <span><strong>{{ ucfirst($invoice->status) }}</strong></span>
                </div>
            </div>
        </div>

        <!-- Customer Section -->
        <div class="customer-section">
            <h3>CLIENT</h3>
            <p><strong>{{ $invoice->customer->name }}</strong></p>
            @if ($invoice->customer->address)
                <p>{{ $invoice->customer->address }}</p>
            @endif
            @if ($invoice->customer->phone)
                <p>Tél: {{ $invoice->customer->phone }}</p>
            @endif
            @if ($invoice->customer->email)
                <p>Email: {{ $invoice->customer->email }}</p>
            @endif
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-right">Quantité</th>
                    <th class="text-right">Prix Unitaire</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($invoice->items as $item)
                    <tr>
                        <td>{{ $item->description }}</td>
                        <td class="text-right">{{ $item->quantity }}</td>
                        <td class="text-right">{{ number_format($item->unit_price, 0, ',', ' ') }} FCFA</td>
                        <td class="text-right">{{ number_format($item->quantity * $item->unit_price, 0, ',', ' ') }} FCFA</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div></div>
            <div class="totals-right">
                <div class="total-row">
                    <span>Sous-total:</span>
                    <span>{{ number_format($invoice->subtotal, 0, ',', ' ') }} FCFA</span>
                </div>
                @if ($invoice->tax_amount > 0)
                    <div class="total-row">
                        <span>Taxes:</span>
                        <span>{{ number_format($invoice->tax_amount, 0, ',', ' ') }} FCFA</span>
                    </div>
                @endif
                @if ($invoice->discount > 0)
                    <div class="total-row">
                        <span>Remise:</span>
                        <span>-{{ number_format($invoice->discount, 0, ',', ' ') }} FCFA</span>
                    </div>
                @endif
                <div class="total-row final">
                    <span>TOTAL:</span>
                    <span>{{ number_format($invoice->total, 0, ',', ' ') }} FCFA</span>
                </div>
            </div>
        </div>

        <!-- Payment Terms -->
        @if ($invoice->notes || $invoice->due_date)
            <div class="payment-terms">
                @if ($invoice->due_date)
                    <h3>Date d'échéance</h3>
                    <p>{{ $invoice->due_date->format('d/m/Y') }}</p>
                @endif
                @if ($invoice->notes)
                    <h3>Notes</h3>
                    <p>{{ $invoice->notes }}</p>
                @endif
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Merci pour votre confiance!</p>
            <p style="margin-top: 10px;">Cette facture a été générée automatiquement le {{ now()->format('d/m/Y à H:i') }}</p>
        </div>
    </div>
</body>
</html>
