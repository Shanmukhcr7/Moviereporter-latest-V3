"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Clock, Database, UserPlus } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getCountFromServer, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"

export function AdminAlerts() {
    const [alerts, setAlerts] = useState<any[]>([])

    useEffect(() => {
        async function checkAlerts() {
            const newAlerts = []

            // 1. Pending Inquiries
            const inquirySnap = await getCountFromServer(collection(db, "artifacts/default-app-id/promotion_inquiries"))
            const inquiryCount = inquirySnap.data().count
            if (inquiryCount > 0) {
                newAlerts.push({
                    id: "inq",
                    type: inquiryCount > 5 ? "critical" : "warning",
                    message: `${inquiryCount} Pending Promotion Requests`,
                    action: "/admin/inquiries",
                    icon: AlertCircle
                })
            }

            // 2. Unread Feedback
            const feedbackSnap = await getCountFromServer(collection(db, "artifacts/default-app-id/feedback"))
            const feedbackCount = feedbackSnap.data().count
            if (feedbackCount > 0) {
                newAlerts.push({
                    id: "feed",
                    type: "warning",
                    message: `${feedbackCount} New User Feedback`,
                    action: "/admin/inquiries",
                    icon: MessageCircleAlert
                })
            }

            // 3. New Users Today (Mock 'Alert' for rapid growth)
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const userSnap = await getCountFromServer(query(collection(db, "artifacts/default-app-id/users"), where("createdAt", ">=", Timestamp.fromDate(yesterday))))
            const newUsers = userSnap.data().count
            if (newUsers > 10) {
                newAlerts.push({
                    id: "growth",
                    type: "success",
                    message: `High Growth: ${newUsers} new users today!`,
                    action: "/admin/users",
                    icon: UserPlus
                })
            }

            // 4. Mocked Storage Warning (as requested by user spec)
            // random chance to show it for demo logic, or just static 'OK'
            // newAlerts.push({ id: "st", type: "info", message: "Storage usage normal (45%)", action: "#", icon: Database })

            setAlerts(newAlerts)
        }
        checkAlerts()
    }, [])

    return (
        <Card className={`shadow-md transition-all duration-300 ${alerts.length > 0 ? 'border-l-4 border-l-red-500 bg-red-50/10 dark:bg-red-950/10' : 'bg-background border'}`}>
            <CardHeader className="pb-2 py-3">
                <CardTitle className={`text-base font-bold flex items-center gap-2 ${alerts.length > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    <AlertCircle className="h-4 w-4" />
                    {alerts.length > 0 ? "Action Required" : "Admin Tasks"}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
                {alerts.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-600 py-1">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">All clear. No pending actions.</span>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <Link href={alert.action} key={alert.id}>
                            <div className={`
                                flex items-center justify-between p-2 rounded border mb-1 cursor-pointer transition-colors text-xs
                                ${alert.type === 'critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100 border-red-200 hover:bg-red-200' : ''}
                                ${alert.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border-amber-200 hover:bg-amber-200' : ''}
                                ${alert.type === 'success' ? 'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 border-green-200 hover:bg-green-200' : ''}
                                ${alert.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border-blue-200 hover:bg-blue-200' : ''}
                            `}>
                                <div className="flex items-center gap-2">
                                    <alert.icon className="h-3 w-3" />
                                    <span className="font-semibold truncate max-w-[200px]">{alert.message}</span>
                                </div>
                                <div className="uppercase font-bold tracking-wider opacity-80" style={{ fontSize: '10px' }}>
                                    {alert.type}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </CardContent>
        </Card>
    )
}

function MessageCircleAlert({ className }: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 2-7 20-4-9-9-4 20-7z" /><path d="M11 13a4 4 0 0 0 0 8 4 4 0 0 0 0-8" /></svg>
}

function CheckCircle({ className }: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> }
