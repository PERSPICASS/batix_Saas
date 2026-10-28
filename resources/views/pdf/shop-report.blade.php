{{--
    Le détail d'une boutique (« Mes boutiques »), à imprimer ou à transmettre.

    Les mêmes chiffres que l'écran (ShopReport). Tout en tableaux : dompdf ne connaît ni
    flex ni grid. La courbe du CA devient un histogramme en cellules de tableau, dompdf
    n'exécutant pas le JavaScript des graphiques.
--}}
@php
    $money = fn ($amount) => number_format((float) $amount, 0, ',', ' ') . ' ' . $currencySymbol;
    $count = fn ($n) => number_format((float) $n, 0, ',', ' ');
    $date = fn (string $iso) => \Carbon\Carbon::parse($iso)->format('d/m/Y');
    $change = function ($now, $before) {
        if (! $before) {
            return '—';
        }
        $pct = (int) round(($now - $before) / abs($before) * 100);

        return ($pct >= 0 ? '+' : '') . $pct . ' %';
    };
    $f = $report['figures'];
    $p = $report['previous'];
    $max = max(1, ...array_map(fn ($point) => max(0, $point['revenue']), $report['timeline']['current']));
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 28pt 32pt; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 8.5pt; color: #1a1a1a; margin: 0; }
        h1 { font-size: 15pt; margin: 0 0 2pt 0; }
        h2 { font-size: 10pt; margin: 14pt 0 5pt 0; padding-bottom: 2pt; border-bottom: 0.8pt solid #333; }
        .muted { color: #555; font-size: 7.5pt; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        .grid td, .grid th { padding: 3pt 4pt; border-bottom: 0.4pt solid #e5e5e5; }
        .grid th { text-align: left; font-size: 7.5pt; text-transform: uppercase; color: #555; }
        .grid th.right { text-align: right; }
        .up { color: #15803d; }
        .down { color: #b91c1c; }
        .two td.col { width: 50%; vertical-align: top; padding: 0; }
        .two td.col + td.col { padding-left: 12pt; }
        .bars td { vertical-align: bottom; padding: 0 0.5pt; height: 70pt; }
        .bar { background: #f59e0b; }
        .bars-labels td { font-size: 6pt; color: #777; text-align: center; padding-top: 2pt; }
    </style>
</head>
<body>

<table>
    <tr>
        <td style="width: 55%; vertical-align: top;">
            @if ($logo)
                <img src="{{ $logo }}" alt="" style="max-height: 44pt; max-width: 150pt; margin-bottom: 6pt;">
            @endif
            <div style="font-size: 13pt; font-weight: bold;">{{ $shop->name }}</div>
            @if ($shop->address)<div class="muted">{{ $shop->address }}</div>@endif
            @if ($shop->city)<div class="muted">{{ $shop->city }}</div>@endif
        </td>
        <td class="right" style="width: 45%; vertical-align: top;">
            <h1>{{ __('documents.shop_report.title') }}</h1>
            <div class="bold">{{ __('documents.shop_report.period', ['start' => $date($period['start']), 'end' => $date($period['end'])]) }}</div>
            <div class="muted">{{ __('documents.shop_report.compared', ['start' => $date($period['previous_start']), 'end' => $date($period['previous_end'])]) }}</div>
            <div class="muted">{{ __('documents.shop_report.generated', ['date' => now()->format('d/m/Y H:i')]) }}</div>
        </td>
    </tr>
</table>

<h2>{{ __('documents.shop_report.indicators') }}</h2>
<table class="grid">
    <tr>
        <th>{{ __('documents.shop_report.indicator') }}</th>
        <th class="right">{{ __('documents.shop_report.current') }}</th>
        <th class="right">{{ __('documents.shop_report.previous') }}</th>
        <th class="right">{{ __('documents.shop_report.change') }}</th>
    </tr>
    @foreach ([
        ['revenue', $f['revenue'], $p['revenue'], true],
        ['count', $f['count'], $p['count'], false],
        ['average_basket', $f['average_basket'], $p['average_basket'], true],
        ['gross_margin', $f['gross_margin'], $p['gross_margin'], true],
        ['expenses', $f['expenses'], $p['expenses'], true],
        ['result', $f['gross_margin'] - $f['expenses'], $p['gross_margin'] - $p['expenses'], true],
    ] as [$key, $now, $before, $isMoney])
        @php($delta = $change($now, $before))
        <tr>
            <td class="{{ $key === 'revenue' || $key === 'result' ? 'bold' : '' }}">{{ __("documents.shop_report.{$key}") }}</td>
            <td class="right">{{ $isMoney ? $money($now) : $count($now) }}</td>
            <td class="right">{{ $isMoney ? $money($before) : $count($before) }}</td>
            <td class="right {{ str_starts_with($delta, '+') ? 'up' : (str_starts_with($delta, '-') ? 'down' : '') }}">{{ $delta }}</td>
        </tr>
    @endforeach
</table>
<p class="muted" style="margin: 4pt 0 0;">{{ __('documents.shop_report.split', ['counter' => $money($report['split']['counter']), 'invoices' => $money($report['split']['invoices'])]) }}</p>

<table class="grid" style="margin-top: 8pt;">
    <tr><th colspan="2">{{ __('documents.shop_report.today') }}</th></tr>
    <tr><td>{{ __('documents.shop_report.receivables') }}</td><td class="right">{{ $money($f['receivables'] ?? 0) }}</td></tr>
    <tr><td>{{ __('documents.shop_report.customer_credit') }}</td><td class="right">{{ $money($f['customer_credit'] ?? 0) }}</td></tr>
    <tr><td>{{ __('documents.shop_report.stock_value') }}</td><td class="right">{{ $money($f['stock_value'] ?? 0) }}</td></tr>
    <tr><td>{{ __('documents.shop_report.low_stock') }}</td><td class="right">{{ $count($f['low_stock'] ?? 0) }}</td></tr>
</table>

<h2>{{ __('documents.shop_report.timeline') }}</h2>
<table class="bars">
    <tr>
        @foreach ($report['timeline']['current'] as $point)
            <td>
                <div class="bar" style="height: {{ max(0.5, round(max(0, $point['revenue']) / $max * 70, 1)) }}pt;"></div>
            </td>
        @endforeach
    </tr>
</table>
<table class="bars-labels">
    <tr>
        @foreach ($report['timeline']['current'] as $i => $point)
            {{-- Une étiquette sur quelques-unes : trente dates côte à côte seraient illisibles. --}}
            <td>{{ $report['timeline']['unit'] === 'month' ? \Carbon\Carbon::parse($point['label'] . '-01')->translatedFormat('M') : ($i % max(1, intdiv(count($report['timeline']['current']), 8)) === 0 ? \Carbon\Carbon::parse($point['label'])->format('d/m') : '') }}</td>
        @endforeach
    </tr>
</table>

<h2>{{ __('documents.shop_report.products') }}</h2>
@if (count($report['products']) === 0)
    <p class="muted">{{ __('documents.shop_report.nothing') }}</p>
@else
    <table class="grid">
        <tr>
            <th>{{ __('documents.shop_report.product') }}</th>
            <th class="right">{{ __('documents.shop_report.quantity') }}</th>
            <th class="right">{{ __('documents.shop_report.revenue') }}</th>
            <th class="right">{{ __('documents.shop_report.margin') }}</th>
        </tr>
        @foreach ($report['products'] as $product)
            <tr>
                <td>{{ $product['name'] }}@if ($product['category'])<span class="muted"> · {{ $product['category'] }}</span>@endif</td>
                <td class="right">{{ \App\Support\Unit::format($product['quantity']) }}</td>
                <td class="right">{{ $money($product['revenue']) }}</td>
                <td class="right {{ $product['margin'] < 0 ? 'down' : '' }}">{{ $money($product['margin']) }}</td>
            </tr>
        @endforeach
    </table>
@endif

<table class="two" style="margin-top: 4pt;">
    <tr>
        <td class="col">
            <h2>{{ __('documents.shop_report.categories') }}</h2>
            <table class="grid">
                @forelse ($report['categories'] as $category)
                    <tr><td>{{ $category['name'] ?? __('documents.shop_report.no_category') }}</td><td class="right">{{ $money($category['revenue']) }}</td></tr>
                @empty
                    <tr><td class="muted">{{ __('documents.shop_report.nothing') }}</td></tr>
                @endforelse
            </table>

            <h2>{{ __('documents.shop_report.payment_methods') }}</h2>
            <table class="grid">
                @forelse ($report['payment_methods'] as $method)
                    <tr><td>{{ __('documents.shop_report.methods')[$method['method']] ?? $method['method'] }} <span class="muted">({{ $method['count'] }} {{ trans_choice('documents.shop_report.sales', $method['count']) }})</span></td><td class="right">{{ $money($method['revenue']) }}</td></tr>
                @empty
                    <tr><td class="muted">{{ __('documents.shop_report.nothing') }}</td></tr>
                @endforelse
            </table>

            <h2>{{ __('documents.shop_report.debtors') }}</h2>
            <table class="grid">
                @forelse ($report['debtors'] as $debtor)
                    <tr><td>{{ $debtor['name'] ?? '—' }}</td><td class="right">{{ $money($debtor['owed']) }}</td></tr>
                @empty
                    <tr><td class="muted">{{ __('documents.shop_report.none') }}</td></tr>
                @endforelse
            </table>
        </td>
        <td class="col">
            <h2>{{ __('documents.shop_report.sellers') }}</h2>
            <table class="grid">
                @forelse ($report['sellers'] as $seller)
                    <tr><td>{{ $seller['name'] ?? __('documents.shop_report.unknown') }} <span class="muted">({{ $seller['count'] }} {{ trans_choice('documents.shop_report.sales', $seller['count']) }})</span></td><td class="right">{{ $money($seller['revenue']) }}</td></tr>
                @empty
                    <tr><td class="muted">{{ __('documents.shop_report.nothing') }}</td></tr>
                @endforelse
            </table>

            <h2>{{ __('documents.shop_report.expenses_by_category') }}</h2>
            <table class="grid">
                @forelse ($report['expenses'] as $expense)
                    <tr><td>{{ $expense['category'] }}</td><td class="right">{{ $money($expense['amount']) }}</td></tr>
                @empty
                    <tr><td class="muted">{{ __('documents.shop_report.nothing') }}</td></tr>
                @endforelse
            </table>

            <h2>{{ __('documents.shop_report.low_stock_list') }}</h2>
            <table class="grid">
                @forelse ($report['low_stock'] as $product)
                    <tr><td>{{ $product['name'] }}</td><td class="right">{{ __('documents.shop_report.stock') }} {{ $product['stock'] }} / {{ __('documents.shop_report.threshold') }} {{ $product['min'] }}</td></tr>
                @empty
                    <tr><td class="muted">{{ __('documents.shop_report.none') }}</td></tr>
                @endforelse
            </table>
        </td>
    </tr>
</table>

<p class="muted" style="margin-top: 14pt;">{{ __('documents.shop_report.definitions') }}</p>

</body>
</html>
