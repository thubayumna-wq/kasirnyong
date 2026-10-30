import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScanning(true);

      // Try BarcodeDetector API if supported natively by browser
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
        });

        const scanInterval = setInterval(async () => {
          if (!videoRef.current || !isOpen) {
            clearInterval(scanInterval);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              clearInterval(scanInterval);
              stopCamera();
              onScanSuccess(detected);
            }
          } catch {
            // Ignore frame detection errors
          }
        }, 300);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorMsg('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan atau gunakan scanner USB / ketik manual.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopCamera();
      onScanSuccess(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 bg-emerald-950/80 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm text-slate-100">Scan Barcode Kamera</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video viewport */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-4 text-center text-xs text-amber-300 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Laser reticle animation */}
              <div className="absolute inset-8 border-2 border-amber-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                <span className="text-[10px] text-center bg-black/60 text-amber-300 py-0.5 px-2 rounded-full self-center">
                  Arahkan barcode ke kotak ini
                </span>
                <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
              </div>
            </>
          )}
        </div>

        {/* Manual input fallback */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Atau ketik nomor barcode..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition active:scale-95"
            >
              Cari
            </button>
          </form>
          <div className="text-[11px] text-slate-400 text-center">
            *Untuk komputer kasir dengan scanner barcode USB, cukup scan langsung tanpa kamera.
          </div>
        </div>
      </div>
    </div>
  );
};
