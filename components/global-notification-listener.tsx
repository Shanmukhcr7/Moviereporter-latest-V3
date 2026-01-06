"use client"

import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react"

interface Notification {
    id: string
    title: string
    message: string
    type: "info" | "warning" | "success"
    link?: string
}

export function GlobalNotificationListener() {
    useEffect(() => {
        // Only query active notifications
        const q = query(collection(db, "notifications"), where("active", "==", true))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" || change.type === "modified") {
                    const data = change.doc.data() as Omit<Notification, "id">
                    const notification = { id: change.doc.id, ...data }

                    showNotification(notification)
                }
            })
        })

        return () => unsubscribe()
    }, [])

    const showNotification = (notification: Notification) => {
        // Check if dismissed locally
        const dismissedKey = `dismissed_notification_${notification.id}`
        if (localStorage.getItem(dismissedKey)) return

        // Dismiss function
        const handleDismiss = (t: string | number) => {
            localStorage.setItem(dismissedKey, "true")
            toast.dismiss(t)
        }

        // Determine Icon & Color
        const Icon = notification.type === 'warning' ? AlertTriangle :
            notification.type === 'success' ? CheckCircle : Info

        const colorClass = notification.type === 'warning' ? 'text-yellow-500' :
            notification.type === 'success' ? 'text-green-500' : 'text-blue-500'

        toast.custom((t) => (
            <div className="w-[350px] bg-background border border-border rounded-lg shadow-lg p-4 flex gap-3 relative pointer-events-auto">
                <div className={`mt-1 bg-muted/50 p-2 rounded-full h-fit ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 pr-6">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {notification.message}
                    </p>
                    {notification.link && (
                        <a
                            href={notification.link}
                            className="text-xs text-primary font-medium mt-2 inline-block hover:underline"
                            onClick={() => handleDismiss(t)}
                        >
                            Learn More →
                        </a>
                    )}
                </div>
                <button
                    onClick={() => handleDismiss(t)}
                    className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        ), {
            duration: Infinity, // Stay until dismissed
            id: notification.id, // Prevent duplicates
            position: 'top-center'
        })
    }

    return null // Headless component
}
