"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Keyboard,
} from "lucide-react";
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

  // Extract clean token from full URL or raw token string
  const extractToken = (rawInput: string): string => {
    let text = rawInput.trim();
    if (text.includes("/loyalty/claim/")) {
      const parts = text.split("/loyalty/claim/");
      text = parts[1]?.split(/[?#]/)[0] || text;
    }
    return text.trim();
  };

  const processToken = async (token: string) => {
    const cleanToken = extractToken(token);
    if (!cleanToken) {
      setErrorMessage("Please enter or scan a valid checkout code.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Stop camera streaming during processing
    stopCamera();

    try {
      let browserId = localStorage.getItem("guestlink_loyalty_browser_id");
      if (!browserId) {
        browserId = "wal_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
        localStorage.setItem("guestlink_loyalty_browser_id", browserId);
      }

      const idempotencyKey = `claim_${cleanToken}_${browserId}`;

      const res = await fetch(`/api/loyalty/checkout/${encodeURIComponent(cleanToken)}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousBrowserId: browserId,
          idempotencyKey,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
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
      }
    } catch {
      setErrorMessage("Network error while validating stamp. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Camera handling
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraSupport(false);
      setMode("manual");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check for BarcodeDetector API
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || isProcessing) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              if (rawValue) {
                clearInterval(scanIntervalRef.current!);
                processToken(rawValue);
              }
            }
          } catch {}
        }, 500);
      }
    } catch (err: any) {
      setCameraError("Camera access denied or unavailable. You can enter the code manually.");
      setMode("manual");
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: brandColor }}
            >
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-none">Collect Stamp</h3>
              <p className="text-[10px] text-slate-400 mt-1">{restaurantName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {successData ? (
            /* Success State */
            <div className="text-center py-4 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">+1 Stamp Added!</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  You now have <strong className="text-slate-800">{successData.currentStamps} stamps</strong> on your card.
                </p>
              </div>

              {successData.newReward && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Reward Unlocked!</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {successData.newReward.rewardTitle}
                  </p>
                  {successData.newReward.rewardDescription && (
                    <p className="text-[11px] text-slate-600">
                      {successData.newReward.rewardDescription}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition"
                style={{ backgroundColor: brandColor }}
              >
                View Stamp Card
              </button>
            </div>
          ) : (
            <>
              {/* Mode Switch Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode("camera")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    mode === "camera"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera Scan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    mode === "manual"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Enter Code</span>
                </button>
              </div>

              {/* Mode 1: Camera Scanner */}
              {mode === "camera" && (
                <div className="space-y-3">
                  <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Overlay Frame */}
                    <div className="absolute inset-8 border-2 border-white/60 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                      <div className="flex justify-between">
                        <span className="w-3 h-3 border-t-2 border-l-2 border-white -mt-0.5 -ml-0.5" />
                        <span className="w-3 h-3 border-t-2 border-r-2 border-white -mt-0.5 -mr-0.5" />
                      </div>
                      <div className="flex justify-between">
                        <span className="w-3 h-3 border-b-2 border-l-2 border-white -mb-0.5 -ml-0.5" />
                        <span className="w-3 h-3 border-b-2 border-r-2 border-white -mb-0.5 -mr-0.5" />
                      </div>
                    </div>

                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
                        <span className="text-xs font-semibold">Validating Stamp...</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-center text-slate-400">
                    Align the checkout QR code presented by staff inside the frame.
                  </p>
                </div>
              )}

              {/* Mode 2: Manual Code Entry */}
              {mode === "manual" && (
                <div className="space-y-3">
                  {cameraError && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                      {cameraError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-xs font-mono text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing || !manualCode.trim()}
                    onClick={() => processToken(manualCode)}
                    className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
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

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
