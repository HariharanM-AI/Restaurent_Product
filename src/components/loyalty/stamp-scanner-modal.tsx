"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Award,
  Gift,
  RotateCcw,
  ArrowRight,
  UploadCloud,
  Keyboard,
} from "lucide-react";
import jsQR from "jsqr";
import { broadcastActivity } from "@/lib/realtime/broadcast";

interface StampScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurantId: string;
  restaurantName: string;
  brandColor?: string;
}

export function StampScannerModal({
  isOpen,
  onClose,
  onSuccess,
  restaurantId,
  restaurantName,
  brandColor = "#0F766E",
}: StampScannerModalProps) {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    stampEarned: number;
    currentStamps: number;
    lifetimeStamps: number;
    newReward?: { rewardTitle: string; rewardDescription?: string | null } | null;
  } | null>(null);

  const [hasCameraSupport, setHasCameraSupport] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedTokenRef = useRef<string | null>(null);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scanLoopRef = useRef<() => void>(() => {});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const barcodeDetectorRef = useRef<any>(null);

  // Extract clean token from full URL or raw token string
  const extractToken = (rawInput: string): string => {
    let text = rawInput.trim();
    if (text.includes("/loyalty/claim/")) {
      const parts = text.split("/loyalty/claim/");
      text = parts[1]?.split(/[?#]/)[0] || text;
    }
    return text.trim();
  };

  const resumeScanning = () => {
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setErrorMessage(null);
    lastScannedTokenRef.current = null;

    if (!streamRef.current || !streamRef.current.active) {
      startCamera();
    } else {
      isScanningRef.current = true;
      if (scanIntervalRef.current) clearTimeout(scanIntervalRef.current);
      scanIntervalRef.current = setTimeout(scanLoopRef.current, 150);
    }
  };

  const processToken = async (token: string) => {
    const cleanToken = extractToken(token);
    if (!cleanToken) {
      setErrorMessage("Please enter or scan a valid checkout code.");
      return;
    }

    if (lastScannedTokenRef.current === cleanToken && isProcessing) {
      return;
    }
    lastScannedTokenRef.current = cleanToken;

    // Pause scanning loop while validating, but KEEP camera stream active
    isScanningRef.current = false;
    if (scanIntervalRef.current) {
      clearTimeout(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let browserId = "wal_" + Math.random().toString(36).substring(2, 12);
      try {
        const stored = localStorage.getItem("guestlink_loyalty_browser_id");
        if (stored) {
          browserId = stored;
        } else {
          browserId = "wal_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
          localStorage.setItem("guestlink_loyalty_browser_id", browserId);
        }
      } catch {
        // Storage disabled fallback
      }

      const idempotencyKey = `claim_${cleanToken}_${browserId}`;

      const res = await fetch(`/api/loyalty/checkout/${encodeURIComponent(cleanToken)}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousBrowserId: browserId,
          idempotencyKey,
          expectedRestaurantId: restaurantId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Only stop camera stream upon confirmed success
        stopCamera();
        setSuccessData(json.data);
        // Instant broadcast so admin dashboards update in real-time
        broadcastActivity(restaurantId, "stamp_claimed", {
          token: cleanToken,
          currentStamps: json.data?.currentStamps,
        });
        onSuccess();
      } else {
        setErrorMessage(
          json.error?.message || "This checkout QR code is invalid, already claimed, or expired."
        );
        // Automatically resume scanning after 2.5s cooldown so user can scan another code
        if (mode === "camera") {
          autoResumeTimerRef.current = setTimeout(() => {
            lastScannedTokenRef.current = null;
            if (!streamRef.current || !streamRef.current.active) {
              startCamera();
            } else {
              isScanningRef.current = true;
              if (scanIntervalRef.current) clearTimeout(scanIntervalRef.current);
              scanIntervalRef.current = setTimeout(scanLoopRef.current, 150);
            }
          }, 2500);
        }
      }
    } catch {
      setErrorMessage("Network error while validating stamp. Please try again.");
      if (mode === "camera") {
        autoResumeTimerRef.current = setTimeout(() => {
          lastScannedTokenRef.current = null;
          if (!streamRef.current || !streamRef.current.active) {
            startCamera();
          } else {
            isScanningRef.current = true;
            if (scanIntervalRef.current) clearTimeout(scanIntervalRef.current);
            scanIntervalRef.current = setTimeout(scanLoopRef.current, 150);
          }
        }, 2500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Camera handling with universal jsQR decoder loop
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraSupport(false);
      setMode("manual");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      isScanningRef.current = true;

      // Offscreen canvas for decoding frames
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      // Hardware BarcodeDetector if browser has it (optional accelerator)
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          barcodeDetectorRef.current = new (window as any).BarcodeDetector({
            formats: ["qr_code"],
          });
        } catch {
          barcodeDetectorRef.current = null;
        }
      }

      const scanLoop = async () => {
        if (!isScanningRef.current) return;
        const video = videoRef.current;

        if (
          video &&
          video.readyState >= video.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          // 1. Try native BarcodeDetector if available
          if (barcodeDetectorRef.current) {
            try {
              const barcodes = await barcodeDetectorRef.current.detect(video);
              if (barcodes.length > 0 && barcodes[0]?.rawValue) {
                isScanningRef.current = false;
                processToken(barcodes[0].rawValue);
                return;
              }
            } catch {}
          }

          // 2. Fall back to / standard jsQR frame-by-frame decoder (works 100% on iOS Safari, Android, WebKit)
          if (ctx && isScanningRef.current) {
            try {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              });
              if (code && code.data && code.data.trim()) {
                isScanningRef.current = false;
                processToken(code.data);
                return;
              }
            } catch {}
          }
        }

        if (isScanningRef.current) {
          scanIntervalRef.current = setTimeout(scanLoop, 150);
        }
      };

      scanLoopRef.current = scanLoop;
      scanIntervalRef.current = setTimeout(scanLoop, 200);
    } catch (err: any) {
      setCameraError("Camera access denied or unavailable. You can upload a photo or enter the code.");
      setMode("manual");
    }
  };

  const stopCamera = () => {
    isScanningRef.current = false;
    if (scanIntervalRef.current) {
      clearTimeout(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Handle photo upload / native camera snapshot
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          if (code && code.data) {
            processToken(code.data);
          } else {
            setIsProcessing(false);
            setErrorMessage("Could not detect a QR code in the selected photo. Please ensure the QR is clear and well-lit.");
          }
        } else {
          setIsProcessing(false);
          setErrorMessage("Image processing error. Please try again.");
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
        setErrorMessage("Failed to process image file. Please try again.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Reset all state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccessData(null);
      setErrorMessage(null);
      setManualCode("");
      setMode("camera");
    }
  }, [isOpen]);

  const handleClose = () => {
    stopCamera();
    setSuccessData(null);
    setErrorMessage(null);
    setManualCode("");
    setMode("camera");
    onClose();
  };

  useEffect(() => {
    if (isOpen && mode === "camera" && !successData) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, successData]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="solid-modal glass-modal relative w-full max-w-sm bg-white dark:bg-[#0D141F] rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs shadow-xs"
              style={{ backgroundColor: brandColor }}
            >
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Collect Stamp</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">{restaurantName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {successData ? (
            /* Success State */
            <div className="text-center py-4 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">+1 Stamp Added!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  You now have <strong className="text-slate-800 dark:text-slate-200">{successData.currentStamps} stamps</strong> on your card.
                </p>
              </div>

              {successData.newReward && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Reward Unlocked!</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {successData.newReward.rewardTitle}
                  </p>
                  {successData.newReward.rewardDescription && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {successData.newReward.rewardDescription}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  style={{ backgroundColor: brandColor }}
                >
                  View Stamp Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessData(null);
                    setErrorMessage(null);
                    setManualCode("");
                    setMode("camera");
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Scan Another QR Code
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Switch Tabs */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setMode("camera")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === "camera"
                      ? "bg-white dark:bg-[#182333] text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera Scan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === "manual"
                      ? "bg-white dark:bg-[#182333] text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Enter Code</span>
                </button>
              </div>

              {/* Mode 1: Camera Scanner */}
              {mode === "camera" && (
                <div className="space-y-3">
                  <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center shadow-inner">
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Overlay Frame */}
                    <div className="absolute inset-8 border-2 border-white/60 rounded-2xl pointer-events-none flex flex-col justify-between p-2 overflow-hidden">
                      <div className="flex justify-between">
                        <span className="w-3.5 h-3.5 border-t-3 border-l-3 border-emerald-400 -mt-0.5 -ml-0.5" />
                        <span className="w-3.5 h-3.5 border-t-3 border-r-3 border-emerald-400 -mt-0.5 -mr-0.5" />
                      </div>

                      {/* Animated Laser Scanning Beam */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse" />

                      <div className="flex justify-between">
                        <span className="w-3.5 h-3.5 border-b-3 border-l-3 border-emerald-400 -mb-0.5 -ml-0.5" />
                        <span className="w-3.5 h-3.5 border-b-3 border-r-3 border-emerald-400 -mb-0.5 -mr-0.5" />
                      </div>
                    </div>

                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                        <span className="text-xs font-semibold">Validating Stamp...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 px-1">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Point camera at checkout QR code
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/70 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 border border-teal-200/80 dark:border-teal-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Snap or Upload</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              )}

              {/* Mode 2: Manual Code Entry */}
              {mode === "manual" && (
                <div className="space-y-3">
                  {cameraError && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-[11px]">
                      {cameraError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Checkout Code or URL
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. clm_abc123 or paste checkout link"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") processToken(manualCode);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#182333] focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing || !manualCode.trim()}
                    onClick={() => processToken(manualCode)}
                    className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Claim Stamp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Error Message with immediate Scan Again recovery */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <span className="leading-snug font-medium">{errorMessage}</span>
                  </div>
                  {mode === "camera" && (
                    <button
                      type="button"
                      onClick={resumeScanning}
                      className="self-end px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70 text-red-800 dark:text-red-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Scan Again</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
