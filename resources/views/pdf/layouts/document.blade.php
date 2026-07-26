{{--
    Ossature A4 commune à la facture et au devis.

    Tout est en tableaux plutôt qu'en flex ou en grid : dompdf n'implémente ni l'un ni
    l'autre, et une mise en page moderne y sort silencieusement de travers.
--}}
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 28pt 32pt; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9pt;
            color: #1a1a1a;
            margin: 0;
        }
        h1 { font-size: 16pt; margin: 0 0 2pt 0; }
        .muted { color: #555; font-size: 8pt; }
        .right { text-align: right; }
        .bold { font-weight: bold; }

        table { width: 100%; border-collapse: collapse; }

        .header td { vertical-align: top; padding: 0; }
        .shop-name { font-size: 13pt; font-weight: bold; }

        .party {
            border: 0.6pt solid #ccc;
            padding: 7pt;
            margin-top: 14pt;
        }

        .lines { margin-top: 14pt; }
        .lines th {
            text-align: left;
            font-size: 8pt;
            text-transform: uppercase;
            border-bottom: 0.8pt solid #333;
            padding: 4pt 3pt;
        }
        .lines td {
            padding: 4pt 3pt;
            border-bottom: 0.4pt solid #e0e0e0;
        }

        .totals-wrap { margin-top: 12pt; }
        .totals-wrap > tr > td { padding: 0; vertical-align: top; }
        .totals td { padding: 2pt 3pt; }
        .totals .grand td {
            font-size: 11pt;
            font-weight: bold;
            border-top: 0.8pt solid #333;
            padding-top: 5pt;
        }
        /* Un montant ne doit jamais se couper : « 1 037 928,00 CFA » passait à la ligne,
           le symbole atterrissant seul sous le nombre. */
        .amount { white-space: nowrap; }

        .breakdown { margin-top: 10pt; width: 45%; }
        .breakdown th, .breakdown td {
            font-size: 8pt;
            padding: 2pt 3pt;
            border-bottom: 0.4pt solid #e0e0e0;
        }
        /* `.breakdown th` l'emportait sur `.right` par spécificité : les en-têtes
           restaient à gauche au-dessus de chiffres alignés à droite. */
        .breakdown th { text-align: left; }
        .breakdown th.right, .breakdown td.right { text-align: right; }

        .notes { margin-top: 14pt; font-size: 8pt; }
        .footer {
            margin-top: 18pt;
            padding-top: 6pt;
            border-top: 0.4pt solid #ccc;
            font-size: 7.5pt;
            color: #555;
            text-align: center;
        }
        .badge {
            border: 0.8pt solid #333;
            padding: 2pt 6pt;
            font-size: 8pt;
            font-weight: bold;
        }
    </style>
</head>
<body>

<table class="header">
    <tr>
        <td style="width: 55%;">
            @if ($logo)
                {{-- Hauteur bornée : un logo téléversé en haute définition écraserait
                     sinon tout l'en-tête. La largeur suit d'elle-même. --}}
                <img src="{{ $logo }}" alt="" style="max-height: 48pt; max-width: 160pt; margin-bottom: 6pt;">
            @endif
            <div class="shop-name">{{ $shop?->name }}</div>
            @if ($shop?->address)
                <div class="muted">{{ $shop->address }}</div>
            @endif
            @if ($shop?->city || $shop?->postal_code)
                <div class="muted">{{ trim($shop->postal_code . ' ' . $shop->city) }}</div>
            @endif
            @if ($shop?->country)
                <div class="muted">{{ $shop->country }}</div>
            @endif
            @if ($shop?->phone)
                <div class="muted">Tél. {{ $shop->phone }}</div>
            @endif
            @if ($shop?->email)
                <div class="muted">{{ $shop->email }}</div>
            @endif
            @if ($shop?->tax_id)
                <div class="muted">N° fiscal : {{ $shop->tax_id }}</div>
            @endif
        </td>
        <td class="right" style="width: 45%;">
            <h1>@yield('title')</h1>
            <div class="bold">@yield('number')</div>
            @yield('meta')
        </td>
    </tr>
</table>

<div class="party">
    <div class="muted">@yield('party-label', 'Client')</div>
    @yield('party')
</div>

@yield('lines')

@yield('totals')

@yield('notes')

<div class="footer">
    @if ($shop?->invoice_footer)
        {{ $shop->invoice_footer }}
    @endif
</div>

</body>
</html>
