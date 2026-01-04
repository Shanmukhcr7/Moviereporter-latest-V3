"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Film, Newspaper, MessageSquare, Star, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getCountFromServer, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

type MetricType = {
    total: number
    recent: number // 24h or 7d
    trend: number // percentage change (mocked or calc)
}

export function KeyMetrics({ period }: { period: "24h" | "7d" }) {
    const [metrics, setMetrics] = useState({
        users: { total: 0, recent: 0 },
        movies: { total: 0, recent: 0 },
        news: { total: 0, recent: 0 },
        reviews: { total: 0, recent: 0 },
        comments: { total: 0, recent: 0 },
    })

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const now = new Date()
                const pastDate = new Date()
                if (period === "24h") pastDate.setDate(now.getDate() - 1)
                else pastDate.setDate(now.getDate() - 7)

                const pastTimestamp = Timestamp.fromDate(pastDate)

                // Define collections to check
                const collections = [
                    { key: "users", name: "users" },
                    { key: "movies", name: "movies" },
                    { key: "news", name: "news" },
                    { key: "reviews", name: "reviews" },
                    { key: "comments", name: "comments" },
                ] as const

                const results: any = {}

                await Promise.all(collections.map(async (col) => {
                    const colRef = collection(db, `artifacts/default-app-id/${col.name}`)

                    // Total Count
                    const totalSnap = await getCountFromServer(colRef)

                    // Recent Count
                    const recentQuery = query(colRef, where("createdAt", ">=", pastTimestamp))
                    const recentSnap = await getCountFromServer(recentQuery)

                    results[col.key] = {
                        total: totalSnap.data().count,
                        recent: recentSnap.data().count
                    }
                }))

                setMetrics(results)

            } catch (error) {
                console.error("Error fetching metrics:", error)
            }
        }
        fetchMetrics()
    }, [period])

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <MetricCard
                title="Total Users"
                icon={Users}
                value={metrics.users.total}
                recent={metrics.users.recent}
                period={period}
            />
            <MetricCard
                title="Total Movies"
                icon={Film}
                value={metrics.movies.total}
                recent={metrics.movies.recent}
                period={period}
            />
            <MetricCard
                title="News & Blogs"
                icon={Newspaper}
                value={metrics.news.total}
                recent={metrics.news.recent}
                period={period}
            />
            <MetricCard
                title="Reviews"
                icon={Star}
                value={metrics.reviews.total}
                recent={metrics.reviews.recent}
                period={period}
            />
            <MetricCard
                title="Comments"
                icon={MessageSquare}
                value={metrics.comments.total}
                recent={metrics.comments.recent}
                period={period}
            />
        </div>
    )
}

function MetricCard({ title, icon: Icon, value, recent, period }: any) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">
                            +{recent} new in {period}
                        </p>
                    </div>
                    <div>
                        {recent > 0 ? (
                            <span className="flex items-center text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                Active
                            </span>
                        ) : (
                            <span className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                <Minus className="h-3 w-3 mr-1" />
                                No change
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
