<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport des Ventes</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            color: #333;
            font-size: 10px;
        }
        .container {
            max-width: 297mm;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            font-size: 18px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 9px;
            color: #666;
        }
        .period {
            text-align: center;
            margin-bottom: 20px;
            font-size: 11px;
            font-weight: bold;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-box {
            border: 1px solid #ddd;
            padding: 12px;
            border-radius: 4px;
        }
        .summary-box h3 {
            font-size: 9px;
            color: #666;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .summary-box .value {
            font-size: 14px;
            font-weight: bold;
            color: #1a1a1a;
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
            padding: 8px;
            text-align: left;
            font-weight: bold;
            font-size: 9px;
        }
        table td {
            padding: 8px;
            border-bottom: 1px solid #eee;
            font-size: 9px;
        }
        table tbody tr:hover {
            background-color: #f5f5f5;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8px;
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
        .status-cancelled {
            background-color: #f8d7da;
            color: #721c24;
        }
        .text-right {
            text-align: right;
        }
        .footer {
            border-top: 1px solid #ddd;
            padding-top: 15px;
            text-align: center;
            font-size: 8px;
            color: #666;
            margin-top: 30px;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>RAPPORT DES VENTES</h1>
            <p>Généré le {{ now()->format('d/m/Y à H:i') }}</p>
        </div>

        <!-- Period -->
        <div class="period">
            {{ $period ?? 'Toutes les périodes' }}
        </div>

        <!-- Summary -->
        <div class="summary">
            <div class="summary-box">
                <h3>Nombre de ventes</h3>
                <div class="value">{{ count($sales) }}</div>
            </div>
            <div class="summary-box">
                <h3>Revenu total</h3>
                <div class="value">{{ number_format($sales->sum('total'), 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="summary-box">
                <h3>Montant payé</h3>
                <div class="value">{{ number_format($sales->sum('amount_paid'), 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="summary-box">
                <h3>Reste dû</h3>
                <div class="value">{{ number_format($sales->sum('remaining_amount'), 0, ',', ' ') }} FCFA</div>
            </div>
        </div>

        <!-- Sales Table -->
        @if (count($sales) > 0)
            <table>
                <thead>
                    <tr>
                        <th>Numéro</th>
                        <th>Date</th>
                        <th>Client</th>
                        <th class="text-right">Total</th>
                        <th class="text-right">Payé</th>
                        <th class="text-right">Reste</th>
                        <th>Méthode</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($sales as $sale)
                        <tr>
                            <td>{{ $sale->ticket_number }}</td>
                            <td>{{ $sale->sale_date->format('d/m/Y H:i') }}</td>
                            <td>{{ $sale->customer->name ?? 'N/A' }}</td>
                            <td class="text-right">{{ number_format($sale->total, 0, ',', ' ') }}</td>
                            <td class="text-right">{{ number_format($sale->amount_paid, 0, ',', ' ') }}</td>
                            <td class="text-right">{{ number_format($sale->remaining_amount, 0, ',', ' ') }}</td>
                            <td>{{ ucfirst(str_replace('_', ' ', $sale->payment_method)) }}</td>
                            <td>
                                <span class="status-badge status-{{ $sale->status }}">
                                    {{ ucfirst($sale->status) }}
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p style="text-align: center; color: #666; padding: 20px;">Aucune vente enregistrée pour cette période.</p>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Ce rapport est généré automatiquement par le système.</p>
        </div>
    </div>
</body>
</html>
