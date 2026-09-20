"use client";

import React from "react";
import {
  Users,
  Eye,
  UtensilsCrossed,
  Star,
  Wifi,
  MessageSquare,
  Award,
  Gamepad2,
  Share2,
  QrCode,
  Radio,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { SaaSCard, SaaSCardHeader } from "@/components/ui/saas-card";
import { StatusBadge } from "@/components/ui/status-badge";

interface AnalyticsData {
  totalViews: number;
  uniqueSessions: number;
  menuClicks: number;
  reviewClicks: number;
  wifiOpens: number;
  wifiCopies: number;
  feedbackSubmits: number;
  loyaltyOpens: number;
  stampsEarned: number;
  gameOpens: number;
  socialClicks: number;
  totalInteractions: number;
  sourceBreakdown: {
    qr: number;
    nfc: number;
    direct: number;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const conversionRate =
    data.totalViews > 0
      ? Math.round(((data.totalInteractions - data.totalViews) / data.totalViews) * 100)
      : 0;

  const totalSourceEvents =
    data.sourceBreakdown.qr + data.sourceBreakdown.nfc + data.sourceBreakdown.direct || 1;

  const qrPercent = Math.round((data.sourceBreakdown.qr / totalSourceEvents) * 100);
  const nfcPercent = Math.round((data.sourceBreakdown.nfc / totalSourceEvents) * 100);
  const directPercent = Math.round((data.sourceBreakdown.direct / totalSourceEvents) * 100);

  return (
    <div className="space-y-6">
      {/* 1. Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Total Visits"
          value={data.totalViews}
          description="Page view impressions"
          accentColor="indigo"
          icon={<Eye className="w-4 h-4" />}
          trend={{ value: "+14%", isPositive: true, label: "vs last week" }}
        />

        <MetricCard
          title="Unique Guests"
          value={data.uniqueSessions}
          description="Distinct dining devices"
          accentColor="turquoise"
          icon={<Users className="w-4 h-4" />}
          trend={{ value: "+9%", isPositive: true, label: "new diners" }}
        />

        <MetricCard
          title="Feature Actions"
          value={Math.max(0, data.totalInteractions - data.totalViews)}
          description="Total in-hub interactions"
          accentColor="orange"
          icon={<TrendingUp className="w-4 h-4" />}
          trend={{ value: `${conversionRate}%`, isPositive: true, label: "conversion rate" }}
        />

        <MetricCard
          title="Stamps Claimed"
          value={data.stampsEarned}
          description="Checkout tokens redeemed"
          accentColor="amber"
          icon={<Award className="w-4 h-4" />}
          trend={{ value: "+22%", isPositive: true, label: "loyalty repeat" }}
        />
      </div>

      {/* 2. Action Breakdown & Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Action Performance Bars */}
        <SaaSCard className="lg:col-span-8">
          <SaaSCardHeader
            title="Action Engagement Funnel"
            subtitle="Interaction volume per feature across digital dining touchpoints"
            action={<StatusBadge status="brand" label="Real-time Telemetry" size="sm" />}
          />

          <div className="space-y-4 text-xs">
            {/* Menu */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-teal-600" />
                  <span>Digital Menu Views</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{data.menuClicks}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (data.menuClicks / (data.totalViews || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Google Reviews */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Google Review Clicks</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{data.reviewClicks}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (data.reviewClicks / (data.totalViews || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Wi-Fi Opens & Copies */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <Wifi className="w-3.5 h-3.5 text-sky-600" />
                  <span>Wi-Fi Connects & Password Copies ({data.wifiCopies} Copies)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{data.wifiOpens}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (data.wifiOpens / (data.totalViews || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Feedback */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  <span>Private Feedback Submissions</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{data.feedbackSubmits}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (data.feedbackSubmits / (data.totalViews || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Loyalty Hub */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Loyalty Wallet Opens</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{data.loyaltyOpens}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (data.loyaltyOpens / (data.totalViews || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Games */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <Gamepad2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sudoku Wait-Time Game Starts</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{data.gameOpens}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (data.gameOpens / (data.totalViews || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Social Links */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <Share2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Social Media Clicks</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{data.socialClicks}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (data.socialClicks / (data.totalViews || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </SaaSCard>

        {/* Traffic Source Touchpoints */}
        <SaaSCard className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <SaaSCardHeader
              title="Touchpoint Distribution"
              subtitle="Physical QR vs NFC vs Web Direct"
            />

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 text-teal-700 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Table QR Code</span>
                    <span className="text-[10px] text-slate-400">Physical tabletop stands</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">{data.sourceBreakdown.qr}</span>
                  <span className="text-[10px] text-teal-800 font-semibold">{qrPercent}%</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700 flex items-center justify-center">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">NFC Touchpoint</span>
                    <span className="text-[10px] text-slate-400">Tap-to-connect tags</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">{data.sourceBreakdown.nfc}</span>
                  <span className="text-[10px] text-indigo-800 font-semibold">{nfcPercent}%</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Direct / Online</span>
                    <span className="text-[10px] text-slate-400">Browser & shared links</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">{data.sourceBreakdown.direct}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{directPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
            Data is strictly anonymous. No guest personal identity is logged during table scans.
          </div>
        </SaaSCard>
      </div>
    </div>
  );
}
