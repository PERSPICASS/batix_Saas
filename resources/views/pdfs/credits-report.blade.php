<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport des Créances</title>
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
            font-size: 10px;
            color: #666;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-box {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 4px;
        }
        .summary-box h3 {
            font-size: 10px;
            color: #666;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .summary-box .value {
            font-size: 16px;
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
            padding: 10px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
        }
        table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
            font-size: 10px;
        }
        table tbody tr:hover {
            background-color: #f5f5f5;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
        }
        .overdue {
            background-color: #ffebee;
            color: #c62828;
        }
        .due-soon {
            background-color: #fff3e0;
            color: #e65100;
        }
        .on-track {
            background-color: #e8f5e9;
            color: #2e7d32;
        }
        .text-right {
            text-align: right;
        }
        .footer {
            border-top: 1px solid #ddd;
            padding-top: 15px;
            text-align: center;
            font-size: 9px;
            color: #666;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>RAPPORT DES CRÉANCES</h1>
            <p>Généré le {{ now()->format('d/m/Y à H:i') }}</p>
        </div>

        <!-- Summary -->
        <div class="summary">
            <div class="summary-box">
                <h3>Nombre de créances</h3>
                <div class="value">{{ count($credits) }}</div>
            </div>
            <div class="summary-box">
                <h3>Montant total dû</h3>
                <div class="value">{{ number_format($credits->sum('remaining_amount'), 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="summary-box">
                <h3>Montant payé</h3>
                <div class="value">{{ number_format($credits->sum('amount_paid'), 0, ',', ' ') }} FCFA</div>
            </div>
        </div>

        <!-- Credits Table -->
        @if (count($credits) > 0)
            <table>
                <thead>
                    <tr>
                        <th>Numéro de Ticket</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th class="text-right">Montant Total</th>
                        <th class="text-right">Payé</th>
                        <th class="text-right">Reste</th>
                        <th>Échéance</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($credits as $credit)
                        @php
                            $now = now();
                            $isOverdue = $credit->credit_due_date && $credit->credit_due_date->isPast();
                            $isDueSoon = $credit->credit_due_date && $credit->credit_due_date->diffInDays($now) <= 7 && !$isOverdue;
                        @endphp
                        <tr>
                            <td>{{ $credit->ticket_number }}</td>
                            <td>{{ $credit->customer->name ?? 'N/A' }}</td>
                            <td>{{ $credit->sale_date->format('d/m/Y') }}</td>
                            <td class="text-right">{{ number_format($credit->total, 0, ',', ' ') }} FCFA</td>
                            <td class="text-right">{{ number_format($credit->amount_paid, 0, ',', ' ') }} FCFA</td>
                            <td class="text-right" style="font-weight: bold;">{{ number_format($credit->remaining_amount, 0, ',', ' ') }} FCFA</td>
                            <td>
                                @if ($credit->credit_due_date)
                                    {{ $credit->credit_due_date->format('d/m/Y') }}
                                @else
                                    -
                                @endif
                            </td>
                            <td>
                                @if ($isOverdue)
                                    <span class="status-badge overdue">Échue</span>
                                @elseif ($isDueSoon)
                                    <span class="status-badge due-soon">À bientôt</span>
                                @else
                                    <span class="status-badge on-track">En cours</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p style="text-align: center; color: #666; padding: 20px;">Aucune créance enregistrée.</p>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Ce rapport est confidentiel et destiné à usage interne uniquement.</p>
        </div>
    </div>
</body>
</html>
