"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"

// Mock data generator since we don't have historical analytics stored per day
const generateData = () => {
    const data = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        data.push({
            name: d.toLocaleDateString('en-US', { weekday: 'short' }),
            users: Math.floor(Math.random() * 50) + 10,
            views: Math.floor(Math.random() * 500) + 100,
        })
    }
    return data
}

export function TimeInsights() {
    const [data, setData] = useState<any[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        setData(generateData())
    }, [])

    if (!mounted) return <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Time-based Insights
                </CardTitle>
                <CardDescription>Traffic and growth trends (Last 7 Days).</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="views" stroke="#8884d8" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                        <Area type="monotone" dataKey="users" stroke="#82ca9d" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
