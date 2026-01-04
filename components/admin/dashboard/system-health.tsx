"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Server, Clock, HardDrive, Cpu, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, limit, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function SystemHealth() {
    const [metrics, setMetrics] = useState<any>(null)
    const [latency, setLatency] = useState<number | null>(null)
    const [status, setStatus] = useState<"online" | "degraded" | "offline">("online")

    useEffect(() => {
        const checkHealth = async () => {
            const start = performance.now()
            try {
                const res = await fetch('/api/health')
                const data = await res.json()
                const end = performance.now()

                setLatency(Math.round(end - start))
                setMetrics(data)
                setStatus(res.ok ? "online" : "offline")
            } catch (error) {
                console.error("Health check failed:", error)
                setStatus("offline")
            }
        }

        checkHealth()
        // Check every 10 seconds for real-time feel on VPS
        const interval = setInterval(checkHealth, 10000)
        return () => clearInterval(interval)
    }, [])

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        if (d > 0) return `${d}d ${h}h`
        if (h > 0) return `${h}h ${m}m`
        return `${m}m`
    }

    return (
        <Card className="border-b-4 border-b-primary shadow-sm bg-gradient-to-r from-background to-muted/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    VPS System Health
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">

                {/* Server Status */}
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><Server className="h-3 w-3" /> Status</span>
                    <div className="flex items-center gap-2 font-medium">
                        {status === "online" ? (
                            <><CheckCircle2 className="h-4 w-4 text-green-500" /> Online</>
                        ) : (
                            <><AlertTriangle className="h-4 w-4 text-red-500" /> Offline</>
                        )}
                    </div>
                </div>

                {/* API Latency */}
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> API Latency</span>
                    <div className={`font-medium ${latency && latency > 200 ? "text-yellow-600" : "text-green-600"}`}>
                        {latency ? `${latency}ms` : "..."}
                    </div>
                </div>

                {/* Real Memory Usage */}
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><HardDrive className="h-3 w-3" /> Memory</span>
                    <div className="font-medium">
                        {metrics?.memory ? (
                            <span className={metrics.memory.usagePercentage > 90 ? "text-red-600" : "text-blue-600"}>
                                {metrics.memory.usagePercentage}% Used
                            </span>
                        ) : "..."}
                    </div>
                </div>

                {/* Real CPU Load */}
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><Cpu className="h-3 w-3" /> CPU Load</span>
                    <div className="font-medium">
                        {metrics?.load ? `${metrics.load.percentage}%` : "..."}
                    </div>
                </div>

                {/* Uptime */}
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Uptime</span>
                    <div className="font-medium text-green-600">
                        {metrics?.uptime ? formatUptime(metrics.uptime) : "..."}
                    </div>
                </div>

                {/* Last Updated */}
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">Last Check</span>
                    <div className="font-medium text-xs">{metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : "..."}</div>
                </div>

            </CardContent>
        </Card>
    )
}
