"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

// Dynamic import for Chart component to avoid SSR issues
const TimeInsights = dynamic(() => import("@/components/admin/dashboard/time-insights").then(mod => mod.TimeInsights), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg" />
})

import { SystemHealth } from "@/components/admin/dashboard/system-health"
import { KeyMetrics } from "@/components/admin/dashboard/key-metrics"
import { ActivityPulse } from "@/components/admin/dashboard/activity-pulse"
import { ContentPerformance } from "@/components/admin/dashboard/content-performance"
import { AdminAlerts } from "@/components/admin/dashboard/admin-alerts"
import { SecuritySnapshot } from "@/components/admin/dashboard/security-snapshot"
import { QuickActions } from "@/components/admin/dashboard/quick-actions"
import { SmartInsights } from "@/components/admin/dashboard/smart-insights"

export default function AdminDashboard() {
  const [metricPeriod, setMetricPeriod] = useState<"24h" | "7d">("24h")

  return (
    <div className="space-y-6 pb-10">

      {/* SECTION 1: System Health (Top Priority) */}
      <SystemHealth />

      {/* Header & Metric Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
        <Tabs value={metricPeriod} onValueChange={(v) => setMetricPeriod(v as "24h" | "7d")}>
          <TabsList>
            <TabsTrigger value="24h">Last 24h</TabsTrigger>
            <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* SECTION 2: Key Platform Metrics */}
      <KeyMetrics period={metricPeriod} />

      {/* SECTION 9: Smart Insights (Insert here for visibility) */}
      <SmartInsights />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Column (pulse and alerts) */}
        <div className="xl:col-span-2 space-y-6">

          {/* SECTION 5: Admin To-Do / Alerts */}
          <AdminAlerts />

          <div className="grid md:grid-cols-2 gap-6">
            {/* SECTION 3: Activity Pulse */}
            <ActivityPulse />
            {/* SECTION 4: Content Performance */}
            <ContentPerformance />
          </div>

          {/* SECTION 6: Time-based Insights */}
          <div className="h-[300px]">
            <TimeInsights />
          </div>
        </div>

        {/* Right Column (Actions and Security) */}
        <div className="space-y-6">
          {/* SECTION 8: Quick Actions */}
          <QuickActions />

          {/* SECTION 7: Security Snapshot */}
          <SecuritySnapshot />

          {/* Extra spacing or future widgets */}
          <div className="bg-muted/20 rounded-lg p-6 border-2 border-dashed border-muted text-center text-muted-foreground text-sm">
            Placeholder for future widgets (Logs, Backup Status)
          </div>
        </div>

      </div>

    </div>
  )
}
