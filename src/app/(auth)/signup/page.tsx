"use client";

import React, { Suspense } from "react";
import { AuthSlider } from "@/components/auth/auth-slider";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#052621] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        </div>
      }
    >
      <AuthSlider initialMode="signup" />
    </Suspense>
  );
}
