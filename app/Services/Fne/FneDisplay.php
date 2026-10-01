<?php

namespace App\Services\Fne;

use App\Models\CreditNote;
use App\Models\Invoice;
use chillerlan\QRCode\Output\QROutputInterface;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

/**
 * Ce que pages et PDF montrent de la certification FNE d'un document.
 *
 * Le QR code est la moitié visible du « sticker électronique » exigé par la DGI : il
 * encode l'URL de vérification publique renvoyée à la certification.
 */
class FneDisplay
{
    /**
     * Null quand la FNE ne concerne pas le document : jamais présenté à la DGI, et
     * boutique qui ne l'utilise pas.
     *
     * @return array<string, mixed>|null
     */
    public static function for(Invoice|CreditNote $document): ?array
    {
        if ($document->fne_status === null) {
            return null;
        }

        return [
            'status' => $document->fne_status,
            'reference' => $document->fne_reference,
            'verification_url' => $document->fne_verification_url,
            'certified_at' => $document->fne_certified_at?->toIso8601String(),
            'error' => $document->fne_error,
            'retryable' => $document->fneRetryable(),
            'qr' => $document->fne_verification_url ? self::qrDataUri($document->fne_verification_url) : null,
        ];
    }

    public static function qrDataUri(string $content): string
    {
        $options = new QROptions([
            'outputType' => QROutputInterface::GDIMAGE_PNG,
            'outputBase64' => true,
            'scale' => 6,
            'quietzoneSize' => 2,
        ]);

        return (new QRCode($options))->render($content);
    }
}
