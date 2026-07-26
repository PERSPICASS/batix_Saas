@extends('pdf.layouts.document')

@section('title', __('documents.invoice'))
@section('number', $invoice->invoice_number)

@section('meta')
    <div class="muted">{{ __('documents.date') }} : {{ $invoice->invoice_date?->format('d/m/Y') }}</div>
    @if ($invoice->due_date)
        <div class="muted">{{ __('documents.due_date') }} : {{ $invoice->due_date->format('d/m/Y') }}</div>
    @endif
    @if (in_array($invoice->status, ['paid', 'cancelled'], true))
        {{-- Une facture payée ou annulée doit se lire comme telle sur le papier :
             c'est ce qui circule, pas l'écran. --}}
        <div style="margin-top: 5pt;">
            <span class="badge">{{ $invoice->status === 'paid' ? __('documents.paid') : __('documents.cancelled') }}</span>
        </div>
    @endif
@endsection

@section('party')
    <div class="bold">{{ $invoice->customer?->name }}</div>
    @if ($invoice->customer?->address)
        <div class="muted">{{ $invoice->customer->address }}</div>
    @endif
    @if ($invoice->customer?->phone)
        <div class="muted">Tél. {{ $invoice->customer->phone }}</div>
    @endif
    @if ($invoice->customer?->email)
        <div class="muted">{{ $invoice->customer->email }}</div>
    @endif
@endsection

@section('lines')
    <table class="lines">
        <thead>
            <tr>
                <th style="width: 46%;">{{ __('documents.description') }}</th>
                <th class="right" style="width: 10%;">{{ __('documents.quantity') }}</th>
                <th class="right" style="width: 16%;">{{ __('documents.unit_price_excl') }}</th>
                <th class="right" style="width: 10%;">{{ __('documents.tax') }}</th>
                <th class="right" style="width: 18%;">{{ __('documents.total_incl') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $item)
                <tr>
                    <td>
                        {{ $item->product_name }}
                        @if ($item->description)
                            <div class="muted">{{ $item->description }}</div>
                        @endif
                    </td>
                    <td class="right">{{ $item->quantity }}</td>
                    <td class="right">{{ number_format($item->unit_price, 2, ',', ' ') }}</td>
                    <td class="right">{{ rtrim(rtrim(number_format($item->tax_rate, 2, ',', ' '), '0'), ',') }} %</td>
                    <td class="right">{{ number_format($item->total, 2, ',', ' ') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection

@section('totals')
    {{-- Ventilation par taux : obligatoire dès que deux lignes n'ont pas le même taux, et
         c'est désormais le cas courant puisque le taux vient du produit. --}}
    @if (count($taxBreakdown) > 0)
        <table class="breakdown">
            <thead>
                <tr>
                    <th style="width: 25%;">{{ __('documents.rate') }}</th>
                    <th class="right" style="width: 40%;">{{ __('documents.base_excl') }}</th>
                    <th class="right" style="width: 35%;">{{ __('documents.tax') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($taxBreakdown as $band)
                    <tr>
                        <td>{{ rtrim(rtrim(number_format($band['rate'], 2, ',', ' '), '0'), ',') }} %</td>
                        <td class="right">{{ number_format($band['base'], 2, ',', ' ') }}</td>
                        <td class="right">{{ number_format($band['tax'], 2, ',', ' ') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    {{-- Le bloc de totaux est isolé dans la colonne de droite d'un tableau porteur.
         Auparavant chaque ligne portait une cellule vide de 65 % : le trait du total
         général la traversait, et courait donc sur toute la largeur de la page. --}}
    <table class="totals-wrap">
        <tr>
            <td style="width: 55%;"></td>
            <td style="width: 45%;">
                <table class="totals">
                    <tr>
                        <td>{{ __('documents.subtotal_excl') }}</td>
                        <td class="right amount">{{ number_format($invoice->subtotal, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                    {{-- La remise se lit avant la TVA parce qu'elle réduit la base
                         imposable : l'afficher après laisserait croire que la taxe porte
                         sur le sous-total non remisé. --}}
                    @if ($invoice->discount_amount > 0)
                        <tr>
                            <td>{{ __('documents.discount') }}</td>
                            <td class="right amount">-{{ number_format($invoice->discount_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                        </tr>
                    @endif
                    <tr>
                        <td>{{ __('documents.tax') }}</td>
                        <td class="right amount">{{ number_format($invoice->tax_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                    <tr class="grand">
                        <td>{{ __('documents.grand_total') }}</td>
                        <td class="right amount">{{ number_format($invoice->total, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
@endsection

@section('notes')
    @if ($invoice->notes)
        <div class="notes">
            <div class="bold">{{ __('documents.notes') }}</div>
            <div>{{ $invoice->notes }}</div>
        </div>
    @endif
@endsection
