import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Check, Loader2 } from 'lucide-react';

interface FaceCaptureModalProps {
  /** Open/close controlled by parent */
  open: boolean;
  /** Called with the JPEG blob; parent then uploads it and closes the modal */
  onCapture: (blob: Blob) => Promise<void>;
  onClose: () => void;
  /** Clock-in time string, shown as context */
  clockInTime?: string | null;
}

type Phase = 'starting' | 'live' | 'captured' | 'uploading';

/**
 * Camera preview + one-shot face capture. The captured JPEG blob is handed to
 * the parent via onCapture (which performs the upload). The modal never talks
 * to the server itself.
 */
export const FaceCaptureModal: React.FC<FaceCaptureModalProps> = ({ open, onCapture, onClose, clockInTime }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>('starting');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const cleanup = () => {
    stopStream();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhase('starting');
    setError(null);
  };

  // Start / stop the camera as the modal opens / closes
  useEffect(() => {
    if (!open) {
      cleanup();
      return;
    }
    let cancelled = false;
    const start = async () => {
      setPhase('starting');
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setPhase('live');
      } catch {
        if (!cancelled) {
          setError('Camera access is required to clock in. Allow camera permission and try again.');
          setPhase('starting');
        }
      }
    };
    start();
    return () => {
      cancelled = true;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const width = video.videoWidth || 480;
    const height = video.videoHeight || 360;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // mirror for selfie view
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Could not capture photo. Please try again.');
          return;
        }
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase('captured');
        // stash blob for submit
        (capture as unknown as { _blob?: Blob })._blob = blob;
      },
      'image/jpeg',
      0.85
    );
  };

  const submit = async () => {
    const blob = (capture as unknown as { _blob?: Blob })._blob;
    if (!blob) return;
    setPhase('uploading');
    setError(null);
    try {
      await onCapture(blob);
      (capture as unknown as { _blob?: Blob })._blob = undefined;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
      setPhase('captured');
    }
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    (capture as unknown as { _blob?: Blob })._blob = undefined;
    setPhase('live');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-900">Face Capture</span>
          </div>
          <button
            type="button"
            onClick={() => {
              cleanup();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            id="face-capture-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {clockInTime && phase !== 'uploading' && (
            <p className="text-[11px] text-slate-500">Clock-in time: <span className="font-mono font-semibold text-slate-700">{clockInTime}</span></p>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
            {phase === 'starting' && !error && (
              <div className="flex flex-col items-center gap-2 text-slate-300">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-[11px]">Starting camera…</span>
              </div>
            )}
            {phase === 'live' && <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />}
            {phase === 'captured' && previewUrl && (
              <img src={previewUrl} alt="Captured face" className="w-full h-full object-cover" />
            )}
            {phase === 'uploading' && (
              <div className="flex flex-col items-center gap-2 text-slate-300">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-[11px]">Submitting…</span>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            {phase === 'live' && (
              <>
                <button
                  type="button"
                  onClick={capture}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                  id="face-capture-shoot"
                >
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cleanup();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </>
            )}
            {phase === 'captured' && (
              <>
                <button
                  type="button"
                  onClick={submit}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5"
                  id="face-capture-submit"
                >
                  <Check className="w-3.5 h-3.5" /> Confirm &amp; Clock In
                </button>
                <button
                  type="button"
                  onClick={retake}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Retake
                </button>
              </>
            )}
            {phase === 'uploading' && (
              <button
                type="button"
                disabled
                className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-semibold cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Clocking in…
              </button>
            )}
            {phase === 'starting' && error && (
              <button
                type="button"
                onClick={() => {
                  cleanup();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
