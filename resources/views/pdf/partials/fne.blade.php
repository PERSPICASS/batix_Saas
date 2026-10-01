{{--
    Le « sticker électronique » de la DGI : QR code de vérification, mention FNE et
    numéro FNE. N'apparaît que pour un document présenté à la FNE ($fne non null).

    Tant que la certification n'est pas obtenue, le document le dit : un PDF sans QR ne
    doit pas pouvoir passer pour une facture normalisée.
--}}
@if ($fne)
    @if ($fne['status'] === 'certified' && $fne['qr'])
        <table style="margin-top: 14pt; border: 0.6pt solid #ccc;">
            <tr>
                <td style="width: 80pt; padding: 5pt; vertical-align: middle;">
                    <img src="{{ $fne['qr'] }}" alt="" style="width: 70pt; height: 70pt;">
                </td>
                <td style="padding: 5pt; vertical-align: middle;">
                    <div class="bold">{{ $fneTitle }}</div>
                    <div>{{ __('documents.fne_number') }} : <span class="bold">{{ $fne['reference'] }}</span></div>
                    @if ($fne['verification_url'])
                        <div class="muted">{{ __('documents.fne_verify') }} : {{ $fne['verification_url'] }}</div>
                    @endif
                </td>
            </tr>
        </table>
    @else
        <div style="margin-top: 14pt;">
            <span class="badge">{{ __('documents.fne_pending') }}</span>
        </div>
    @endif
@endif
