"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  QrCode,
  Heart,
  MessageSquare,
  BarChart3,
  Quote,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
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

  // Animation DOM Refs
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
    return window.innerWidth <= 768;
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
        return;
      }

      if (isMobile()) {
        wipe.style.clipPath = "none";
        wipe.style.opacity = "0";
        wipe.style.transform = "translateX(12px)";
        wipe.style.transition = `opacity ${DUR * 0.7}ms cubic-bezier(0.65, 0, 0.35, 1), transform ${DUR * 0.7}ms cubic-bezier(0.65, 0, 0.35, 1)`;
        wipe.style.pointerEvents = "auto";

        requestAnimationFrame(() => {
          wipe.style.opacity = "1";
          wipe.style.transform = "translateX(0)";
        });

        setTimeout(() => {
          setMode(target);
          setTargetMode(null);
          wipe.style.opacity = "";
          wipe.style.transform = "";
          wipe.style.transition = "";
          wipe.style.pointerEvents = "none";
          setAnimating(false);
          window.history.pushState(null, "", target === "signup" ? "/signup" : "/login");
        }, DUR * 0.7);
        return;
      }

      const dir = target === "signup" ? 1 : -1;
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
          setMode(target);
          setTargetMode(null);
          wipe.style.pointerEvents = "none";
          wipe.style.clipPath = "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)";
          wipe.style.opacity = "";
          wipe.style.transform = "";
          wipe.style.transition = "";
          seamSharp.style.opacity = "0";
          seamSoft.style.opacity = "0";
          setAnimating(false);
          window.history.pushState(null, "", target === "signup" ? "/signup" : "/login");
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
          restaurantName: signupRestaurantName.trim() || `${signupName}'s Kitchen`,
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
      <div className="bg-[#082F29] text-white p-7 sm:p-9 lg:p-10 flex flex-col justify-between relative overflow-hidden h-full">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Section */}
        <div className="relative z-10">
          <div className="text-[11px] font-extrabold tracking-[0.2em] text-[#d8a860] uppercase">
            {isSignup ? "START YOUR JOURNEY" : "MORE THAN A MENU"}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-2 leading-[1.18] tracking-tight">
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
          <p className="text-xs text-emerald-100/70 mt-3 leading-relaxed max-w-sm">
            {isSignup
              ? "Join hundreds of dining venues and hospitality brands growing revenue with smart touchpoints."
              : "Everything you need to create memorable guest experiences, build loyalty, and grow your business — in one simple platform."}
          </p>

          {/* Features list & Arched photo cut-out */}
          <div className="mt-6 sm:mt-7 flex items-start gap-4">
            <div className="space-y-3.5 flex-1">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">QR & NFC</div>
                  <div className="text-[11px] text-emerald-200/60">Instant, seamless access</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Loyalty & Rewards</div>
                  <div className="text-[11px] text-emerald-200/60">Turn visits into lasting relationships</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Guest Feedback</div>
                  <div className="text-[11px] text-emerald-200/60">Listen, learn, and improve</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Powerful Analytics</div>
                  <div className="text-[11px] text-emerald-200/60">Make data-driven decisions</div>
                </div>
              </div>
            </div>

            {/* Arched Photo Cut-out with warm ambiance */}
            <div className="hidden sm:block relative w-32 h-52 rounded-t-[60px] rounded-b-2xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl shrink-0">
              <Image
                src="/restaurant-showcase.jpg"
                alt="Fine dining experience"
                fill
                className="object-cover"
                sizes="140px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5 text-center">
                <span className="text-white font-serif italic text-[11px] leading-tight drop-shadow-md">
                  Great Experiences Bring People Back
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial Box */}
        <div className="mt-6 pt-4 border-t border-emerald-900/60 relative z-10">
          <div className="flex items-start gap-2.5">
            <Quote className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-100/80 italic leading-relaxed">
              "GuestLink has helped us create a more connected experience with our customers. It's simple, powerful, and easy to use."
            </p>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-700 border border-emerald-400/40 flex items-center justify-center text-white text-[10px]">
                <User className="w-3 h-3" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white">A Happy Customer</div>
                <div className="text-[9px] text-emerald-300/70">Restaurant Owner</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <ChevronLeft className="w-3.5 h-3.5 cursor-pointer opacity-60 hover:opacity-100" />
              <ChevronRight className="w-3.5 h-3.5 cursor-pointer opacity-60 hover:opacity-100" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Sign In Form
  const renderSignInForm = () => {
    return (
      <div className="bg-white p-7 sm:p-9 lg:p-11 flex flex-col justify-center h-full overflow-y-auto">
        {/* Segmented Switcher [Sign In | Sign Up] */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => switchTo("signin")}
              className="px-6 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-xs shadow-xs transition"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTo("signup")}
              className="px-6 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 font-semibold text-xs transition"
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="text-center mb-5">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to your GuestLink account.
          </p>
        </div>

        {loginError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-700 text-slate-900 placeholder:text-slate-400"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showLoginPassword ? "text" : "password"}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-700 text-slate-900 placeholder:text-slate-400"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Toggle password visibility"
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleFillDemoLogin}
              className="text-emerald-700 font-bold hover:underline"
            >
              Auto-fill demo
            </button>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#0B3B36] hover:bg-[#072B26] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {loginLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Or continue with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleFillDemoLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-2xs"
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

        <p className="mt-4 text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => switchTo("signup")}
            className="text-emerald-700 font-extrabold hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    );
  };

  // Render Sign Up Form
  const renderSignUpForm = () => {
    return (
      <div className="bg-white p-7 sm:p-9 lg:p-11 flex flex-col justify-center h-full overflow-y-auto">
        {/* Segmented Switcher [Sign In | Sign Up] */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => switchTo("signin")}
              className="px-6 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 font-semibold text-xs transition"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTo("signup")}
              className="px-6 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-xs shadow-xs transition"
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Start your 30-day free trial
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            No credit card required. Instant venue setup.
          </p>
        </div>

        {signupError && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{signupError}</span>
          </div>
        )}

        <form onSubmit={handleSignupSubmit} className="space-y-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-700 text-slate-900 placeholder:text-slate-400"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Restaurant name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={signupRestaurantName}
                onChange={(e) => setSignupRestaurantName(e.target.value)}
                placeholder="e.g. The Green Table"
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-700 text-slate-900 placeholder:text-slate-400"
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-700 text-slate-900 placeholder:text-slate-400"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? "text" : "password"}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 8 chars"
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-700 text-slate-900 placeholder:text-slate-400"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? "text" : "password"}
                  required
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-700 text-slate-900 placeholder:text-slate-400"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5 text-xs">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="text-slate-600 text-[11px] select-none cursor-pointer">
              I agree to the <span className="text-emerald-700 font-bold hover:underline">Terms</span> and{" "}
              <span className="text-emerald-700 font-bold hover:underline">Privacy</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={signupLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0B3B36] hover:bg-[#072B26] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50 mt-1"
          >
            {signupLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Restaurant Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-3 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Or continue with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleFillDemoSignup}
          className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-2xs"
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

        <p className="mt-3 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => switchTo("signin")}
            className="text-emerald-700 font-extrabold hover:underline"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full w-full min-h-[620px] lg:min-h-[660px]">
        {/* In signin mode: Form on left (order-1), Info on right (order-2) */}
        {/* In signup mode: Info on left (order-1), Form on right (order-2) */}
        {viewMode === "signin" ? (
          <>
            <div className="order-1 flex flex-col justify-center h-full">
              {renderSignInForm()}
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
              {renderSignUpForm()}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#052621] text-slate-900 flex flex-col justify-between relative overflow-hidden p-4 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-white">
      {/* Background organic gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-700/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-teal-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#072C27]/40 blur-[160px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-500/30 transition">
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">GuestLink</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-emerald-100/70 text-xs hidden sm:inline">
            {mode === "signin" ? "New here?" : "Already a member?"}
          </span>
          <button
            type="button"
            disabled={animating}
            onClick={() => switchTo(mode === "signin" ? "signup" : "signin")}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition disabled:opacity-50"
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </header>

      {/* Main Animated Card Scene */}
      <main className="w-full max-w-5xl mx-auto my-4 z-10">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[28px] bg-white shadow-2xl border border-white/10 min-h-[620px] lg:min-h-[660px]"
        >
          {/* Base Face (Current Active Form) */}
          <div className="relative w-full h-full z-[1]">
            {renderFaceContent(mode)}
          </div>

          {/* Wipe Face (Revealed via diagonal clipPath during transition) */}
          <div
            ref={wipeRef}
            className="absolute inset-0 z-[2] pointer-events-none overflow-hidden bg-white"
            style={{
              clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
            }}
          >
            {targetMode && renderFaceContent(targetMode)}
          </div>

          {/* Soft Glowing Seam riding the diagonal */}
          <div
            ref={seamSoftRef}
            className="absolute top-[-4%] h-[108%] w-[18px] opacity-0 z-[4] pointer-events-none blur-[7px] origin-top"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(216,168,96,0.5) 40%, rgba(216,168,96,0.5) 60%, transparent)",
            }}
          />

          {/* Sharp Glowing Seam riding the diagonal edge */}
          <div
            ref={seamSharpRef}
            className="absolute top-[-4%] h-[108%] w-[3.5px] opacity-0 z-[5] pointer-events-none origin-top"
            style={{
              background:
                "linear-gradient(180deg, transparent, #e9c98c 45%, #d8a860 55%, transparent)",
              boxShadow: "0 0 24px 4px rgba(216,168,96, 0.75), 0 0 8px 1px rgba(233,201,140, 0.9)",
            }}
          />
        </div>

        {/* Subtle Hint Below Card */}
        <p className="text-center mt-3.5 text-xs text-emerald-200/50 select-none">
          Try both directions — switch modes to send the glowing diagonal seam across the card.
        </p>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-[11px] text-emerald-300/40 font-bold z-10 py-2">
        <span className="tracking-[0.15em]">BETTER GUESTS. BRIGHTER BUSINESS.</span>
        <span className="tracking-[0.2em]">GUESTLINK</span>
      </footer>
    </div>
  );
}
