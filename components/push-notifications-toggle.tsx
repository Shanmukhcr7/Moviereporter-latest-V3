"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff } from "lucide-react"
import { toast } from "sonner"
import { getToken } from "firebase/messaging"
// import { messaging } from "@/lib/firebase" // We need to export messaging if we want real usage
// For now we'll simulate or use window.Notification

export function PushNotificationsToggle() {
    const [enabled, setEnabled] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>("default")

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission)
            setEnabled(Notification.permission === "granted")
        }
    }, [])

    const handleToggle = async (checked: boolean) => {
        if (!("Notification" in window)) {
            toast.error("Notifications not supported on this device")
            return
        }

        if (checked) {
            const perm = await Notification.requestPermission()
            setPermission(perm)
            if (perm === "granted") {
                setEnabled(true)
                toast.success("Notifications enabled!")
                // Here we would typically get the FCM token and save to DB
                // const token = await getToken(messaging, { vapidKey: '...' })
            } else {
                setEnabled(false)
                toast.error("Permission denied")
            }
        } else {
            // We can't strictly revoke permission programmatically in browser,
            // but we can update our local state/preference.
            setEnabled(false)
            toast.info("Notifications disabled")
        }
    }

    return (
        <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
                {enabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                <Label htmlFor="push-notifs" className="text-sm font-medium">Notifications</Label>
            </div>
            <Switch
                id="push-notifs"
                checked={enabled}
                onCheckedChange={handleToggle}
            />
        </div>
    )
}
