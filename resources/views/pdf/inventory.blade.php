{{--
    Le résultat d'un inventaire, à imprimer ou à archiver : attendu, compté, écart et sa
    valeur, produit par produit — les mêmes nombres que la fiche à l'écran.

    Une ligne non comptée affiche un tiret, jamais 0 : 0 voudrait dire « compté, aucun
    trouvé ». Le signe de l'écart est écrit, la couleur ne survivant ni à une photocopie
    ni au daltonisme. Tout en tableaux : dompdf ne connaît ni flex ni grid.
--}}
@php
    $unit = fn ($item) => $item->product?->unit;
    $qty = fn ($value, $item) => $value === null ? '—' : \App\Support\Unit::format($value, $unit($item));
    $signed = fn ($value, $item) => $value === null ? '—' : ($value > 0 ? '+' : '') . \App\Support\Unit::format($value, $unit($item));
    $money = fn ($amount) => number_format((float) $amount, 2, ',', ' ');
    $signedMoney = fn ($amount) => ($amount > 0 ? '+' : '') . $money($amount);

    $values = $items->filter(fn ($item) => $item->counted_quantity !== null)->map(fn ($item) => $item->discrepancyValue());
    $shortage = round($values->filter(fn ($v) => $v < 0)->sum(), 2);
    $surplus = round($values->filter(fn ($v) => $v > 0)->sum(), 2);
    $uncounted = $items->whereNull('counted_quantity')->count();
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 28pt 32pt; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 8.5pt; color: #1a1a1a; margin: 0; }
        h1 { font-size: 15pt; margin: 0 0 2pt 0; }
        .muted { color: #555; font-size: 7.5pt; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        .summary { margin-top: 14pt; }
        .summary td { border: 0.6pt solid #ccc; padding: 6pt; width: 25%; vertical-align: top; }
        .summary .figure { font-size: 11pt; font-weight: bold; white-space: nowrap; }
        .lines { margin-top: 14pt; }
        .lines th {
            text-align: left; font-size: 7pt; text-transform: uppercase;
            border-bottom: 0.8pt solid #333; padding: 4pt 3pt;
        }
        .lines th.right { text-align: right; }
        .lines td { padding: 3.5pt 3pt; border-bottom: 0.4pt solid #e0e0e0; }
        .lines td.right { white-space: nowrap; }
        .lines tr.total td { font-weight: bold; border-top: 0.8pt solid #333; border-bottom: none; padding-top: 5pt; }
        .notes { margin-top: 14pt; font-size: 8pt; }
        .footer { margin-top: 18pt; padding-top: 6pt; border-top: 0.4pt solid #ccc; font-size: 7pt; color: #555; }
    </style>
</head>
<body>

<table>
    <tr>
        <td style="width: 55%; vertical-align: top;">
            @if ($logo)
                <img src="{{ $logo }}" alt="" style="max-height: 44pt; max-width: 150pt; margin-bottom: 6pt;">
            @endif
            <div style="font-size: 13pt; font-weight: bold;">{{ $shop?->name }}</div>
            @if ($shop?->address)<div class="muted">{{ $shop->address }}</div>@endif
            @if ($shop?->city)<div class="muted">{{ $shop->city }}</div>@endif
        </td>
        <td class="right" style="width: 45%; vertical-align: top;">
            <h1>{{ __('documents.inventory.title') }}</h1>
            <div class="bold">{{ $inventory->inventory_number }}</div>
            <div class="muted">{{ __('documents.date') }} : {{ $inventory->inventory_date?->format('d/m/Y') }}</div>
            <div class="muted">{{ __('documents.inventory.status') }} : {{ __('documents.inventory.statuses.' . $inventory->status) }}</div>
            @if ($inventory->completed_at)
                <div class="muted">{{ __('documents.inventory.applied', ['date' => $inventory->completed_at->format('d/m/Y H:i')]) }}</div>
            @endif
            @if ($inventory->user)
                <div class="muted">{{ __('documents.inventory.performed_by', ['name' => $inventory->user->name]) }}</div>
            @endif
        </td>
    </tr>
</table>

@if (! in_array($inventory->status, ['completed', 'cancelled'], true))
    {{-- Un brouillon n'a encore rien changé au stock : sans cette mention, le papier se lit
         comme un constat définitif. --}}
    <div class="notes bold">{{ __('documents.inventory.not_applied') }}</div>
@endif

<table class="summary">
    <tr>
        <td>
            <div class="muted">{{ __('documents.inventory.counted_items') }}</div>
            <div class="figure">{{ $items->count() - $uncounted }} / {{ $items->count() }}</div>
        </td>
        <td>
            <div class="muted">{{ __('documents.inventory.shortage') }}</div>
            <div class="figure">{{ $signedMoney($shortage) }} {{ $currencySymbol }}</div>
        </td>
        <td>
            <div class="muted">{{ __('documents.inventory.surplus') }}</div>
            <div class="figure">{{ $signedMoney($surplus) }} {{ $currencySymbol }}</div>
        </td>
        <td>
            <div class="muted">{{ __('documents.inventory.net') }}</div>
            <div class="figure">{{ $signedMoney($shortage + $surplus) }} {{ $currencySymbol }}</div>
        </td>
    </tr>
</table>

<table class="lines">
    <thead>
        <tr>
            <th>{{ __('documents.inventory.product') }}</th>
            <th class="right">{{ __('documents.inventory.expected') }}</th>
            <th class="right">{{ __('documents.inventory.counted') }}</th>
            <th class="right">{{ __('documents.inventory.difference') }}</th>
            <th class="right">{{ __('documents.inventory.defective') }}</th>
            <th class="right">{{ __('documents.inventory.defective_difference') }}</th>
            <th class="right">{{ __('documents.inventory.unit_cost') }}</th>
            <th class="right">{{ __('documents.inventory.value') }}</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($items as $item)
            @php $counted = $item->counted_quantity !== null; @endphp
            <tr>
                <td>
                    {{ $item->product?->name }}
                    @if ($item->product?->sku)
                        <div class="muted">{{ $item->product->sku }}</div>
                    @endif
                </td>
                <td class="right">{{ $qty($item->expected_quantity, $item) }}</td>
                <td class="right">{{ $qty($item->counted_quantity, $item) }}</td>
                <td class="right">{{ $counted ? $signed($item->difference, $item) : '—' }}</td>
                <td class="right">{{ $qty($item->defective_quantity, $item) }}</td>
                <td class="right">{{ $item->defective_quantity !== null ? $signed($item->defective_difference, $item) : '—' }}</td>
                <td class="right">{{ $money($item->unit_cost) }}</td>
                <td class="right">{{ $counted ? $signedMoney($item->discrepancyValue()) : '—' }}</td>
            </tr>
        @endforeach
        <tr class="total">
            <td colspan="7">{{ __('documents.inventory.total') }}</td>
            <td class="right">{{ $signedMoney($shortage + $surplus) }} {{ $currencySymbol }}</td>
        </tr>
    </tbody>
</table>

@if ($inventory->notes)
    <div class="notes">
        <div class="bold">{{ __('documents.notes') }}</div>
        <div>{{ $inventory->notes }}</div>
    </div>
@endif

<div class="footer">
    {{ __('documents.inventory.legend') }}
    · {{ __('documents.shop_report.generated', ['date' => now()->format('d/m/Y H:i')]) }}
</div>

</body>
</html>
