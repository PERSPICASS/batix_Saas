import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface Props {
    onScan: (code: string) => void;
    onClose: () => void;
}

const SUPPORTED_FORMATS = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.ITF,
];

export default function BarcodeScanner({ onScan, onClose }: Props) {
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannedRef = useRef(false);
    const CONTAINER_ID = 'barcode-scanner-view';

    useEffect(() => {
        const scanner = new Html5Qrcode(CONTAINER_ID, {
            verbose: false,
            formatsToSupport: SUPPORTED_FORMATS,
        });
        scannerRef.current = scanner;

        scanner
            .start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 260, height: 140 },
                },
                (decodedText) => {
                    if (scannedRef.current) return;
                    scannedRef.current = true;
                    scanner.stop().catch(() => {}).finally(() => {
                        onScan(decodedText);
                    });
                },
                () => {}
            )
            .then(() => setScanning(true))
            .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.includes('Permission') || msg.includes('permission')) {
                    setError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres du navigateur.");
                } else {
                    setError("Impossible d'accéder à la caméra. Vérifiez qu'aucune autre application ne l'utilise.");
                }
            });

        return () => {
            try { scanner.stop().catch(() => {}); } catch { /* not started */ }
        };
    }, []);

    const handleClose = () => {
        try { scannerRef.current?.stop().catch(() => {}); } catch { /* not started */ }
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <div className="flex items-center gap-2 text-white">
                        <Camera className="size-5 text-amber-300" />
                        <span className="font-semibold">Scanner un code</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="p-4">
                    {error ? (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                            <p className="font-medium">Erreur caméra</p>
                            <p className="mt-1 text-red-400">{error}</p>
                        </div>
                    ) : (
                        <div className="relative overflow-hidden rounded-xl bg-black">
                            <div id={CONTAINER_ID} className="w-full" />
                            {scanning && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="relative h-28 w-64">
                                        <div className="absolute inset-0 border-2 border-amber-300/60 rounded" />
                                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-300/80 animate-scan" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-3 text-center text-xs text-slate-400">
                        Pointez la caméra vers un <span className="text-amber-300">QR code</span> ou un <span className="text-amber-300">code-barres</span>
                    </div>
                    <div className="mt-1 text-center text-xs text-slate-500">
                        EAN-13 · EAN-8 · Code 128 · Code 39 · QR Code
                    </div>
                </div>
            </div>
        </div>
    );
}
