import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center mb-5 shadow-xs">
        <SearchX className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full mb-3">
        404 — Page Not Located
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Requested Resource Not Found
      </h1>

      <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
        The restaurant link, QR touchpoint, or admin view you are trying to access does not exist or may have been relocated.
      </p>

      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="primary" size="md" icon={<Home className="w-4 h-4" />}>
            GuestLink Home
          </Button>
        </Link>
        <Link href="/admin">
          <Button variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
            Admin Portal
          </Button>
        </Link>
      </div>
    </div>
  );
}
