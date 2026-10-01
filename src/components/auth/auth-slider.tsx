"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  QrCode,
  Heart,
  MessageSquare,
  BarChart3,
  Quote,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface AuthSliderProps {
  initialMode?: "signin" | "signup";
}

export function AuthSlider({ initialMode = "signin" }: AuthSliderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [targetMode, setTargetMode] = useState<"signin" | "signup" | null>(null);
  const [animating, setAnimating] = useState(false);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState("admin@barlowfields.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up Form State
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupRestaurantName, setSignupRestaurantName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Animation DOM Refs (Desktop Glowing Diagonal Seam Wipe)
  const cardRef = useRef<HTMLDivElement | null>(null);
  const wipeRef = useRef<HTMLDivElement | null>(null);
  const seamSharpRef = useRef<HTMLDivElement | null>(null);
  const seamSoftRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const DUR = 760;
  const K = 16; // diagonal lean, in % of width

  const easeInOutCubic = (x: number) => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };

  const isMobile = () => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 1024;
  };

  const setClip = useCallback((el: HTMLElement, dir: number, p: number) => {
    if (dir === 1) {
      const edgeTop = -K + p * (100 + 2 * K);
      const edgeBottom = edgeTop - K;
      el.style.clipPath = `polygon(0% 0%, ${edgeTop}% 0%, ${edgeBottom}% 100%, 0% 100%)`;
      return (edgeTop + edgeBottom) / 2;
    } else {
      const edgeTop = (100 + K) - p * (100 + 2 * K);
      const edgeBottom = edgeTop + K;
      el.style.clipPath = `polygon(${edgeTop}% 0%, 100% 0%, 100% 100%, ${edgeBottom}% 100%)`;
      return (edgeTop + edgeBottom) / 2;
    }
  }, []);

  const switchTo = useCallback(
    (target: "signin" | "signup") => {
      if (animating || mode === target) return;

      // On mobile / tablet screens (< 1024px): state-driven transition with smooth popLayout
      if (isMobile()) {
        setAnimating(true);
        setMode(target);
        setTargetMode(null);
        window.history.replaceState(null, "", target === "signup" ? "/signup" : "/login");
        setTimeout(() => setAnimating(false), 200);
        return;
      }

      // On desktop screens (>= 1024px): run the glowing diagonal seam wipe with pixel-perfect handoff
      setAnimating(true);
      setTargetMode(target);

      const card = cardRef.current;
      const wipe = wipeRef.current;
      const seamSharp = seamSharpRef.current;
      const seamSoft = seamSoftRef.current;

      if (!card || !wipe || !seamSharp || !seamSoft) {
        setMode(target);
        setTargetMode(null);
        setAnimating(false);
        window.history.replaceState(null, "", target === "signup" ? "/signup" : "/login");
        return;
      }

      const dir = target === "signup" ? 1 : -1;
      wipe.style.display = "block";
      wipe.style.pointerEvents = "auto";
      setClip(wipe, dir, 0);

      seamSharp.style.opacity = "1";
      seamSoft.style.opacity = "1";

      const start = performance.now();

      const frame = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / DUR);
        const p = easeInOutCubic(t);

        const centerPct = setClip(wipe, dir, p);
        seamSharp.style.left = `${centerPct}%`;
        seamSoft.style.left = `${centerPct}%`;

        const cardWidth = card.offsetWidth;
        const cardHeight = card.offsetHeight;
        const lean = -Math.atan(((K / 100) * cardWidth) / cardHeight) * (180 / Math.PI);

        seamSharp.style.transform = `skewX(${lean}deg)`;
        seamSoft.style.transform = `skewX(${lean}deg)`;

        if (t < 1) {
          animFrameIdRef.current = requestAnimationFrame(frame);
        } else {
          // Animation reached 100%
          // Fade out the seams cleanly
          seamSharp.style.opacity = "0";
          seamSoft.style.opacity = "0";

          // Expand wipe completely to cover entire card
          wipe.style.clipPath = "none";

          // Update React mode
          setMode(target);
          window.history.replaceState(null, "", target === "signup" ? "/signup" : "/login");

          // Double requestAnimationFrame ensures React has committed and the browser
          // has painted the new base face BEFORE hiding the wipe overlay.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              wipe.style.display = "none";
              wipe.style.pointerEvents = "none";
              setTargetMode(null);
              setAnimating(false);
            });
          });
        }
      };

      animFrameIdRef.current = requestAnimationFrame(frame);
    },
    [animating, mode, setClip]
  );

  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Handle Sign In Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await signIn("credentials", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
        redirect: false,
      });

      if (res?.error) {
        setLoginError("Invalid email or password. Please check your credentials.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setLoginError("An unexpected authentication error occurred. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError(null);

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match. Please verify.");
      setSignupLoading(false);
      return;
    }

    if (!agreeTerms) {
      setSignupError("Please accept the Terms of Service to continue.");
      setSignupLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setSignupError(json?.error?.message || "Failed to create restaurant account. Try again.");
        setSignupLoading(false);
        return;
      }

      // Auto sign-in
      const signInRes = await signIn("credentials", {
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        redirect: false,
      });

      if (signInRes?.ok) {
        router.push(`/admin/restaurants/${json.data.restaurant.id}/dashboard`);
        router.refresh();
      } else {
        switchTo("signin");
      }
    } catch {
      setSignupError("An unexpected error occurred during account creation. Please try again.");
      setSignupLoading(false);
    }
  };

  const handleFillDemoLogin = () => {
    setLoginEmail("admin@barlowfields.com");
    setLoginPassword("password123");
  };

  const handleFillDemoSignup = () => {
    setSignupName("John Doe");
    setSignupEmail("owner@thegreentable.com");
    setSignupRestaurantName("The Green Table");
    setSignupPassword("Password123!");
    setSignupConfirmPassword("Password123!");
  };

  // Render Green Showcase Panel (The Info Side)
  const renderSideInfo = (viewMode: "signin" | "signup") => {
    const isSignup = viewMode === "signup";

    return (
      <div className="bg-gradient-to-br from-[#062923]/95 via-[#08352E]/92 to-[#041F1B]/95 backdrop-blur-2xl text-white p-7 sm:p-9 lg:p-10 flex flex-col justify-between relative overflow-hidden h-full border-l border-emerald-500/15">
        {/* Ambient background glow orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Section */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/10 text-[11px] font-extrabold tracking-[0.2em] text-[#d8a860] uppercase shadow-xs">
            <Sparkles className="w-3 h-3 text-[#d8a860]" />
            <span>{isSignup ? "START YOUR JOURNEY" : "MORE THAN A MENU"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-3 leading-[1.18] tracking-tight">
            {isSignup ? (
              <>
                Empower your <br />
                <span className="text-[#e9c98c] italic font-serif">dining venue.</span>
              </>
            ) : (
              <>
                Turn guests <br />
                into <span className="text-emerald-300">regulars.</span>
              </>
            )}
          </h1>
          <p className="text-xs text-emerald-100/75 mt-3 leading-relaxed max-w-sm">
            {isSignup
              ? "Join hundreds of dining venues and hospitality brands growing revenue with smart touchpoints."
              : "Everything you need to create memorable guest experiences, build loyalty, and grow your business — in one simple platform."}
          </p>

          {/* Features list & Arched photo cut-out */}
          <div className="mt-6 sm:mt-7 flex items-start gap-4">
            <div className="space-y-3.5 flex-1">
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-110 group-hover:bg-white/[0.14] transition-all duration-300 shadow-sm">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">QR & NFC</div>
                  <div className="text-[11px] text-emerald-200/60">Instant, seamless access</div>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-110 group-hover:bg-white/[0.14] transition-all duration-300 shadow-sm">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Loyalty & Rewards</div>
                  <div className="text-[11px] text-emerald-200/60">Turn visits into lasting relationships</div>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-110 group-hover:bg-white/[0.14] transition-all duration-300 shadow-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Guest Feedback</div>
                  <div className="text-[11px] text-emerald-200/60">Listen, learn, and improve</div>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-110 group-hover:bg-white/[0.14] transition-all duration-300 shadow-sm">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Powerful Analytics</div>
                  <div className="text-[11px] text-emerald-200/60">Make data-driven decisions</div>
                </div>
              </div>
            </div>

            {/* Arched Photo Cut-out with warm ambiance */}
            <div className="hidden sm:block relative w-32 h-52 rounded-t-[60px] rounded-b-2xl overflow-hidden border-2 border-[#d8a860]/40 shadow-2xl shrink-0 group">
              <Image
                src="/restaurant-showcase.jpg"
                alt="Fine dining experience"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="140px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-2.5 text-center">
                <span className="text-white font-serif italic text-[11px] leading-tight drop-shadow-md">
                  Great Experiences Bring People Back
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial Box */}
        <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
          <div className="p-3.5 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/[0.08] transition-colors">
            <div className="flex items-start gap-2.5">
              <Quote className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-100/90 italic leading-relaxed">
                "Noura has helped us create a more connected experience with our customers. It's simple, powerful, and easy to use."
              </p>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-700/80 border border-emerald-400/40 flex items-center justify-center text-white text-[10px]">
                  <User className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">A Happy Customer</div>
                  <div className="text-[9px] text-emerald-300/80">Restaurant Owner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Sign In Form with Glassmorphism
  const renderSignInForm = () => {
    return (
      <div className="bg-transparent lg:bg-white/[0.90] p-6 sm:p-8 lg:p-11 flex flex-col justify-center h-full overflow-y-auto lg:backdrop-blur-2xl">
        {/* Segmented Switcher [Sign In | Sign Up] with Glassmorphism */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-black/30 lg:bg-slate-900/[0.05] backdrop-blur-md border border-white/15 lg:border-slate-900/[0.08] shadow-inner gap-1">
            <button
              type="button"
              onClick={() => switchTo("signin")}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#072F29] to-[#0A4B40] text-white font-extrabold text-xs shadow-md shadow-emerald-950/30 transition-all duration-300 scale-[1.02] cursor-default border border-white/20 lg:border-none"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTo("signup")}
              className="px-6 py-2 rounded-xl text-emerald-100/70 hover:text-white hover:bg-white/10 lg:text-slate-600 lg:hover:text-slate-900 lg:hover:bg-white/70 font-semibold text-xs transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white lg:text-slate-900 tracking-tight drop-shadow-sm">
            Welcome back
          </h2>
          <p className="text-xs text-emerald-100/80 lg:text-slate-500 mt-1.5 font-medium">
            Sign in to manage your guest experience hub.
          </p>
        </div>

        {loginError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/20 lg:bg-red-50/90 backdrop-blur-md border border-red-400/40 lg:border-red-200 text-red-200 lg:text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 lg:text-red-600" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/90 lg:text-slate-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-black/25 lg:bg-white/80 hover:bg-black/35 focus:bg-black/40 border border-white/25 lg:border-slate-200/90 focus:border-emerald-400 lg:focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 lg:focus:ring-emerald-500/15 text-white lg:text-slate-900 placeholder:text-white/40 lg:placeholder:text-slate-400 transition-all duration-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] lg:shadow-2xs backdrop-blur-sm lg:backdrop-blur-none"
              />
              <Mail className="w-4 h-4 text-emerald-200/70 lg:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/90 lg:text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showLoginPassword ? "text" : "password"}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-black/25 lg:bg-white/80 hover:bg-black/35 focus:bg-black/40 border border-white/25 lg:border-slate-200/90 focus:border-emerald-400 lg:focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 lg:focus:ring-emerald-500/15 text-white lg:text-slate-900 placeholder:text-white/40 lg:placeholder:text-slate-400 transition-all duration-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] lg:shadow-2xs backdrop-blur-sm lg:backdrop-blur-none"
              />
              <Lock className="w-4 h-4 text-emerald-200/70 lg:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200/70 hover:text-white lg:text-slate-400 lg:hover:text-slate-700 p-1 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-emerald-100/90 lg:text-slate-600 select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/30 bg-white/10 lg:border-slate-300 lg:bg-white text-emerald-500 focus:ring-emerald-400 cursor-pointer"
              />
              <span className="group-hover:text-white lg:group-hover:text-slate-900 transition-colors">Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleFillDemoLogin}
              className="text-emerald-300 hover:text-emerald-200 lg:text-emerald-700 lg:hover:text-emerald-800 font-bold hover:underline transition-colors"
            >
              Auto-fill demo
            </button>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#072F29] via-[#0B3B36] to-[#0A4B40] hover:from-[#0B483E] hover:to-[#10705E] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/25 hover:shadow-xl hover:shadow-emerald-800/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 group border border-emerald-400/30 lg:border-none"
          >
            {loginLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/20 lg:bg-slate-200/80" />
          <span className="text-[10px] text-emerald-200/70 lg:text-slate-400 uppercase font-bold tracking-wider">Or continue with</span>
          <div className="flex-1 h-px bg-white/20 lg:bg-slate-200/80" />
        </div>

        <button
          type="button"
          onClick={handleFillDemoLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-white/90 hover:bg-white backdrop-blur-sm border border-slate-200/90 hover:border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-all duration-300 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        <p className="mt-5 text-center text-xs text-emerald-100/80 lg:text-slate-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => switchTo("signup")}
            className="text-emerald-300 hover:text-emerald-200 lg:text-emerald-700 lg:hover:text-emerald-800 font-extrabold hover:underline transition-colors hover:scale-105 inline-block"
          >
            Sign Up
          </button>
        </p>
      </div>
    );
  };

  // Render Sign Up Form with Glassmorphism
  const renderSignUpForm = () => {
    return (
      <div className="bg-transparent lg:bg-white/[0.90] p-6 sm:p-8 lg:p-11 flex flex-col justify-center h-full overflow-y-auto lg:backdrop-blur-2xl">
        {/* Segmented Switcher [Sign In | Sign Up] with Glassmorphism */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex p-1.5 rounded-2xl bg-black/30 lg:bg-slate-900/[0.05] backdrop-blur-md border border-white/15 lg:border-slate-900/[0.08] shadow-inner gap-1">
            <button
              type="button"
              onClick={() => switchTo("signin")}
              className="px-6 py-2 rounded-xl text-emerald-100/70 hover:text-white hover:bg-white/10 lg:text-slate-600 lg:hover:text-slate-900 lg:hover:bg-white/70 font-semibold text-xs transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTo("signup")}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#072F29] to-[#0A4B40] text-white font-extrabold text-xs shadow-md shadow-emerald-950/30 transition-all duration-300 scale-[1.02] cursor-default border border-white/20 lg:border-none"
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-white lg:text-slate-900 tracking-tight drop-shadow-sm">
            Start your 30-day free trial
          </h2>
          <p className="text-xs text-emerald-100/80 lg:text-slate-500 mt-1 font-medium">
            No credit card required. Instant venue setup.
          </p>
        </div>

        {signupError && (
          <div className="mb-3.5 p-3.5 rounded-2xl bg-red-500/20 lg:bg-red-50/90 backdrop-blur-md border border-red-400/40 lg:border-red-200 text-red-200 lg:text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 lg:text-red-600" />
            <span>{signupError}</span>
          </div>
        )}

        <form onSubmit={handleSignupSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-white/90 lg:text-slate-700 mb-1">
              Full name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-black/25 lg:bg-white/80 hover:bg-black/35 focus:bg-black/40 border border-white/25 lg:border-slate-200/90 focus:border-emerald-400 lg:focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 lg:focus:ring-emerald-500/15 text-white lg:text-slate-900 placeholder:text-white/40 lg:placeholder:text-slate-400 transition-all duration-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] lg:shadow-2xs backdrop-blur-sm lg:backdrop-blur-none"
              />
              <User className="w-4 h-4 text-emerald-200/70 lg:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/90 lg:text-slate-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-black/25 lg:bg-white/80 hover:bg-black/35 focus:bg-black/40 border border-white/25 lg:border-slate-200/90 focus:border-emerald-400 lg:focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 lg:focus:ring-emerald-500/15 text-white lg:text-slate-900 placeholder:text-white/40 lg:placeholder:text-slate-400 transition-all duration-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] lg:shadow-2xs backdrop-blur-sm lg:backdrop-blur-none"
              />
              <Mail className="w-4 h-4 text-emerald-200/70 lg:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-white/90 lg:text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? "text" : "password"}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 8 chars"
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-black/25 lg:bg-white/80 hover:bg-black/35 focus:bg-black/40 border border-white/25 lg:border-slate-200/90 focus:border-emerald-400 lg:focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 lg:focus:ring-emerald-500/15 text-white lg:text-slate-900 placeholder:text-white/40 lg:placeholder:text-slate-400 transition-all duration-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] lg:shadow-2xs backdrop-blur-sm lg:backdrop-blur-none"
                />
                <Lock className="w-3.5 h-3.5 text-emerald-200/70 lg:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-200/70 hover:text-white lg:text-slate-400 lg:hover:text-slate-700 p-1 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/90 lg:text-slate-700 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? "text" : "password"}
                  required
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/25 lg:bg-white/80 hover:bg-black/35 focus:bg-black/40 border border-white/25 lg:border-slate-200/90 focus:border-emerald-400 lg:focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 lg:focus:ring-emerald-500/15 text-white lg:text-slate-900 placeholder:text-white/40 lg:placeholder:text-slate-400 transition-all duration-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] lg:shadow-2xs backdrop-blur-sm lg:backdrop-blur-none"
                />
                <Lock className="w-3.5 h-3.5 text-emerald-200/70 lg:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5 text-xs">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/30 bg-white/10 lg:border-slate-300 lg:bg-white text-emerald-500 focus:ring-emerald-400 cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="text-emerald-100/90 lg:text-slate-600 text-[11px] select-none cursor-pointer">
              I agree to the <span className="text-emerald-300 lg:text-emerald-700 font-bold hover:underline">Terms</span> and{" "}
              <span className="text-emerald-300 lg:text-emerald-700 font-bold hover:underline">Privacy</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={signupLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#072F29] via-[#0B3B36] to-[#0A4B40] hover:from-[#0B483E] hover:to-[#10705E] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/25 hover:shadow-xl hover:shadow-emerald-800/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 group mt-1 border border-emerald-400/30 lg:border-none"
          >
            {signupLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/20 lg:bg-slate-200/80" />
          <span className="text-[10px] text-emerald-200/70 lg:text-slate-400 uppercase font-bold tracking-wider">Or continue with</span>
          <div className="flex-1 h-px bg-white/20 lg:bg-slate-200/80" />
        </div>

        <button
          type="button"
          onClick={handleFillDemoSignup}
          className="w-full py-2 px-4 rounded-xl bg-white/90 hover:bg-white backdrop-blur-sm border border-slate-200/90 hover:border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-all duration-300 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        <p className="mt-4 text-center text-xs text-emerald-100/80 lg:text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => switchTo("signin")}
            className="text-emerald-300 hover:text-emerald-200 lg:text-emerald-700 lg:hover:text-emerald-800 font-extrabold hover:underline transition-colors hover:scale-105 inline-block"
          >
            Sign In
          </button>
        </p>
      </div>
    );
  };

  // Render Full Face: Info + Form
  const renderFaceContent = (viewMode: "signin" | "signup") => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full w-full min-h-[580px] lg:min-h-[660px]">
        {viewMode === "signin" ? (
          <>
            <div className="order-1 flex flex-col justify-center h-full">
              {/* Mobile layout: Smooth simultaneous popLayout crossfade */}
              <div className="block lg:hidden h-full">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key="signin-mobile"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="h-full flex flex-col justify-center"
                  >
                    {renderSignInForm()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Desktop layout: Direct render for 100% flicker-free diagonal wipe handoff */}
              <div className="hidden lg:flex flex-col justify-center h-full">
                {renderSignInForm()}
              </div>
            </div>
            <div className="order-2 hidden lg:block h-full">
              {renderSideInfo("signin")}
            </div>
          </>
        ) : (
          <>
            <div className="order-2 lg:order-1 hidden lg:block h-full">
              {renderSideInfo("signup")}
            </div>
            <div className="order-1 lg:order-2 flex flex-col justify-center h-full">
              {/* Mobile layout: Smooth simultaneous popLayout crossfade */}
              <div className="block lg:hidden h-full">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key="signup-mobile"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="h-full flex flex-col justify-center"
                  >
                    {renderSignUpForm()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Desktop layout: Direct render for 100% flicker-free diagonal wipe handoff */}
              <div className="hidden lg:flex flex-col justify-center h-full">
                {renderSignUpForm()}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col justify-between relative overflow-hidden p-3.5 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-white">
      {/* Background image with deep atmospheric overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth-bg.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#04201c]/55 backdrop-blur-[1px]" />
      </div>

      {/* Floating ambient colored glowing orbs for authentic Glassmorphism depth */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-emerald-500/20 blur-[130px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-teal-400/20 blur-[140px] pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#d8a860]/10 blur-[120px] pointer-events-none" />

      {/* Top Header - Floating Glassmorphic Pill */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2.5 px-4 sm:px-6 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md border border-white/30 flex items-center justify-center p-0.5 shadow-md group-hover:scale-105 group-hover:shadow-emerald-500/30 transition-all duration-300 overflow-hidden">
            <img src="/images/Own brand logo.png" alt="Noura" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-extrabold text-lg sm:text-xl tracking-tight group-hover:text-emerald-200 transition-colors">
            Noura
          </span>
        </Link>

        {/* Header Right: "New here?" / "Already a member?" + Animated Glass Button for ALL screens */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-emerald-100/90 text-[11px] sm:text-xs font-semibold whitespace-nowrap">
            {mode === "signin" ? "New here?" : "Already a member?"}
          </span>
          <button
            type="button"
            disabled={animating}
            onClick={() => switchTo(mode === "signin" ? "signup" : "signin")}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/25 hover:border-emerald-400/60 backdrop-blur-md shadow-sm hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 group cursor-pointer"
          >
            <span>{mode === "signin" ? "Sign Up" : "Sign In"}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Glassmorphism Auth Card */}
      <main className="w-full max-w-5xl mx-auto my-3 sm:my-5 z-10">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] backdrop-blur-md lg:backdrop-blur-2xl bg-white/[0.03] lg:bg-white/[0.12] shadow-[0_30px_90px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/25 min-h-[580px] lg:min-h-[660px]"
        >
          {/* Base Face (Current Active Form / Info) */}
          <div className="relative w-full h-full z-[1]">
            {renderFaceContent(mode)}
          </div>

          {/* Wipe Face (Desktop only: Revealed via diagonal clipPath during transition) */}
          <div
            ref={wipeRef}
            className="hidden lg:block absolute inset-0 z-[2] pointer-events-none overflow-hidden"
            style={{
              display: "none",
              clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
            }}
          >
            {targetMode && renderFaceContent(targetMode)}
          </div>

          {/* Soft Glowing Seam riding the diagonal (Desktop) */}
          <div
            ref={seamSoftRef}
            className="hidden lg:block absolute top-[-4%] h-[108%] w-[18px] opacity-0 z-[4] pointer-events-none blur-[7px] origin-top"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(216,168,96,0.5) 40%, rgba(216,168,96,0.5) 60%, transparent)",
            }}
          />

          {/* Sharp Glowing Seam riding the diagonal edge (Desktop) */}
          <div
            ref={seamSharpRef}
            className="hidden lg:block absolute top-[-4%] h-[108%] w-[3.5px] opacity-0 z-[5] pointer-events-none origin-top"
            style={{
              background:
                "linear-gradient(180deg, transparent, #e9c98c 45%, #d8a860 55%, transparent)",
              boxShadow: "0 0 24px 4px rgba(216,168,96, 0.75), 0 0 8px 1px rgba(233,201,140, 0.9)",
            }}
          />
        </div>
      </main>

      {/* Bottom Footer - Glassmorphic Pill */}
      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-[10px] sm:text-[11px] text-emerald-200/70 font-bold z-10 py-2.5 px-4 sm:px-6 rounded-2xl backdrop-blur-md bg-white/[0.04] border border-white/10 shadow-sm">
        <span className="tracking-[0.15em]">BETTER GUESTS. BRIGHTER BUSINESS.</span>
        <span className="tracking-[0.2em] text-emerald-300">NOURA</span>
      </footer>
    </div>
  );
}
