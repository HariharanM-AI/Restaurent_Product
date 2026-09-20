import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  Award,
  UtensilsCrossed,
  ArrowRight,
  Smartphone,
  Sparkles,
  Wifi,
  Users,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Lock,
  Star,
  FileText,
  UserPlus,
  Layers,
  Check,
  ChevronRight,
  HelpCircle,
  Building2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-teal-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-800/20">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-xl text-slate-900">
                  GuestLink
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  SaaS Platform
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium block">
                Smart Restaurant Guest Experience Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/r/barlow-and-fields"
              target="_blank"
              className="hidden md:inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-slate-600 hover:text-teal-800 hover:bg-teal-50/50 transition"
            >
              <Smartphone className="w-4 h-4 text-teal-700" />
              <span>Diner Demo Hub</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition shadow-2xs"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Sign In</span>
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-sm font-extrabold px-5 sm:px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-800/15 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up Free</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-8 py-12 sm:py-20 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold mb-6 shadow-xs animate-in fade-in-50">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Frictionless Digital Dining Platform for Modern Restaurants</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl leading-[1.12] mb-6">
          Transform Every Dining Table into an{" "}
          <span className="text-teal-700 underline decoration-emerald-300 decoration-wavy decoration-2 underline-offset-8">
            Interactive Digital Hub
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-slate-600 text-lg sm:text-2xl leading-relaxed max-w-3xl mb-10 font-normal">
          Give your dining guests instant access to your official menu, 1-tap Google reviews, auto-connect Wi-Fi, and digital stamp cards.{" "}
          <span className="font-semibold text-slate-800">Zero app downloads required.</span>
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-base sm:text-lg font-extrabold shadow-xl shadow-teal-800/20 hover:scale-[1.02] transition-all"
          >
            <span>Register Your Restaurant Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/r/barlow-and-fields"
            target="_blank"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 text-base sm:text-lg font-bold shadow-sm transition"
          >
            <Smartphone className="w-5 h-5 text-teal-700" />
            <span>Explore Live Diner Hub</span>
          </Link>
        </div>

        {/* Proof Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-500 pb-16 border-b border-slate-200/80 w-full max-w-4xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Setup in under 60 seconds</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Upload PDF or photo menus</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Direct Google Maps review boost</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Multi-tenant data privacy</span>
          </div>
        </div>

        {/* 6 Core Product Benefits Grid (Bigger UI, Green & White) */}
        <div className="w-full py-16">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
              Everything Your Venue Needs
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Powerful In-Venue Touchpoints Built for Growth
            </h3>
            <p className="text-base text-slate-500 mt-2 max-w-2xl mx-auto">
              Replace paper menus, password sticky notes, and paper punch cards with one unified digital experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {/* 1. Google Reviews */}
            <div className="p-8 rounded-[28px] bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                5-Star Google Reviews Booster
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect your Google Maps link directly to the tabletop portal. Prompt satisfied diners to write 5-star reviews right as they finish their meals.
              </p>
            </div>

            {/* 2. PDF & Photo Menus */}
            <div className="p-8 rounded-[28px] bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Frictionless PDF & Photo Menus
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload your official menu PDF or snap photos of your physical pages. Diners can read, zoom, and explore your menu without app installation.
              </p>
            </div>

            {/* 3. Wi-Fi Auto-Join */}
            <div className="p-8 rounded-[28px] bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <Wifi className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Auto-Connect Guest Wi-Fi
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Provide secure guest Wi-Fi with auto-join QR codes. Stop waitstaff from constantly repeating network passwords.
              </p>
            </div>

            {/* 4. Digital Stamp Loyalty */}
            <div className="p-8 rounded-[28px] bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                <Award className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                VIP Stamp Card Loyalty
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Issue tamper-resistant digital stamps on checkout. Drive repeat dining visits with milestone rewards like free desserts and bill discounts.
              </p>
            </div>

            {/* 5. Private Feedback Defense */}
            <div className="p-8 rounded-[28px] bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Private Feedback Shield
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Give diners a confidential channel to share feedback directly with management before negative comments end up on Yelp, TripAdvisor, or Google.
              </p>
            </div>

            {/* 6. Advanced Visualizations */}
            <div className="p-8 rounded-[28px] bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Executive Insights Dashboard
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Monitor live scan volumes, customer retention curves, menu engagement funnels, and repeat diner rates with crystal-clear visual charts.
              </p>
            </div>
          </div>
        </div>

        {/* 4-Step Process Section */}
        <div className="w-full py-16 border-t border-slate-200/80">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
              Simple Onboarding
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              How GuestLink Works for Your Restaurant
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2 relative shadow-xs">
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-sm mb-3">
                1
              </span>
              <h4 className="font-bold text-base text-slate-900">Sign Up Your Venue</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Create your owner account in 60 seconds. Receive your isolated multi-tenant restaurant dashboard immediately.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2 relative shadow-xs">
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-sm mb-3">
                2
              </span>
              <h4 className="font-bold text-base text-slate-900">Upload Menu & Links</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Attach your menu PDF or photos, paste your Google Maps link, and enter your guest Wi-Fi credentials.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2 relative shadow-xs">
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-sm mb-3">
                3
              </span>
              <h4 className="font-bold text-base text-slate-900">Export Print Table QRs</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download high-resolution tabletop QR cards or acrylic stand templates tailored with your branding.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2 relative shadow-xs">
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-sm mb-3">
                4
              </span>
              <h4 className="font-bold text-base text-slate-900">Delight Diners & Grow</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Guests scan to view menus, leave reviews, and earn stamps. Watch your customer retention climb.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom High-Converting CTA Banner */}
        <div className="w-full mt-10 p-10 sm:p-16 rounded-[36px] bg-gradient-to-br from-teal-800 to-slate-900 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to Upgrade Your Dining Room?
            </h3>
            <p className="text-teal-100 text-base sm:text-lg leading-relaxed">
              Join forward-thinking restaurants and bistros providing elevated tabletop digital experiences.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-teal-900 hover:bg-teal-50 text-base font-extrabold shadow-lg transition"
              >
                Create Restaurant Account &rarr;
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-teal-700/60 hover:bg-teal-700 text-white text-base font-bold border border-teal-500/40 transition"
              >
                Sign In to Existing Hub
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 px-5 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-slate-800">GuestLink SaaS</span>
            <span>&copy; {new Date().getFullYear()} Enterprise Hospitality Systems.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/signup" className="hover:text-teal-800 font-bold transition">
              Restaurant Sign Up
            </Link>
            <Link href="/login" className="hover:text-teal-800 font-bold transition">
              Admin Sign In
            </Link>
            <Link href="/r/barlow-and-fields" target="_blank" className="hover:text-teal-800 font-bold transition">
              Sample Diner Hub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
