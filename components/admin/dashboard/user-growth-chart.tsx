"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, subDays } from "date-fns"

export function UserGrowthChart() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch last 500 users
                const usersRef = collection(db, "artifacts/default-app-id/users")
                const q = query(usersRef, orderBy("createdAt", "desc"), limit(500))
                const snapshot = await getDocs(q)

                // Process data: Group by date
                const dateMap = new Map<string, number>()

                // Initialize last 30 days with 0
                for (let i = 29; i >= 0; i--) {
                    const d = subDays(new Date(), i)
                    dateMap.set(format(d, "yyyy-MM-dd"), 0)
                }

                snapshot.docs.forEach(doc => {
                    const userData = doc.data()
                    if (userData.createdAt) {
                        try {
                            const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)
                            const key = format(date, "yyyy-MM-dd")
                            if (dateMap.has(key)) {
                                dateMap.set(key, (dateMap.get(key) || 0) + 1)
                            }
                        } catch (e) {
                            // ignore invalid dates
                        }
                    }
                })

                // Convert to array
                const chartData = Array.from(dateMap.entries()).map(([date, count]) => ({
                    date: format(new Date(date), "MMM dd"),
                    users: count
                }))

                setData(chartData)
            } catch (error) {
                console.error("Error fetching user stats:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New signups over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New signups over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                padding={{ left: 10, right: 10 }}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="users"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
