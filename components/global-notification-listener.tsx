"use client"

import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { usePathname } from "next/navigation"

interface Notification {
    id: string
    title: string
    message: string
    type: "info" | "warning" | "success"
    link?: string
    displayStyle?: "toast" | "banner"
    imageUrl?: string
}

export function GlobalNotificationListener() {
    const pathname = usePathname()
    // We need state for Banner only, Toasts are handled by Sonner
    const [banner, setBanner] = useState<Notification | null>(null)

    useEffect(() => {
        // Only query active notifications
        const q = query(collection(db, "notifications"), where("active", "==", true))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" || change.type === "modified") {
                    const data = change.doc.data() as Omit<Notification, "id">
                    const notification = { id: change.doc.id, ...data }

                    // Check if dismissed
                    const dismissedKey = `dismissed_notification_${notification.id}`
                    if (localStorage.getItem(dismissedKey)) return

                    if (notification.displayStyle === 'banner') {
                        setBanner(notification)
                    } else {
                        showToast(notification)
                    }
                }

                // If notification became inactive or removed, clear banner if it matches
                if (change.type === "removed" || (change.type === 'modified' && !change.doc.data().active)) {
                    setBanner(prev => (prev?.id === change.doc.id ? null : prev))
                }
            })
        })

        return () => unsubscribe()
    }, [])

    const handleDismissBanner = () => {
        if (!banner) return
        localStorage.setItem(`dismissed_notification_${banner.id}`, "true")
        setBanner(null)
    }

    const showToast = (notification: Notification) => {
        // Dismiss function for toast
        const dismissedKey = `dismissed_notification_${notification.id}`
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
            <div className="w-[90vw] md:w-full max-w-[400px] mx-auto bg-background border border-border rounded-lg shadow-lg p-4 flex gap-3 relative pointer-events-auto">
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
            position: 'top-right'
        })
    }

    // Render Banner Modal
    // HOMEPAGE ONLY CHECK
    if (!banner || pathname !== '/') return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                <button
                    onClick={handleDismissBanner}
                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md z-50 border border-white/20"
                >
                    <X className="h-5 w-5" />
                </button>

                {banner.imageUrl && (
                    <div className="relative w-full flex-1 min-h-[200px] overflow-hidden bg-black/20">
                        {/* Full Image Display */}
                        <Image
                            src={banner.imageUrl}
                            alt={banner.title}
                            width={800}
                            height={600}
                            className="w-full h-full object-contain max-h-[60vh] bg-black"
                            priority
                        />
                    </div>
                )}

                <div className="p-6 text-center shrink-0 bg-background/95 backdrop-blur">
                    <div className={`mx-auto mb-3 p-2 rounded-full w-fit inline-flex items-center justify-center ${banner.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                        banner.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                        {banner.type === 'warning' ? <AlertTriangle className="h-6 w-6" /> :
                            banner.type === 'success' ? <CheckCircle className="h-6 w-6" /> : <Info className="h-6 w-6" />}
                    </div>

                    <h2 className="text-2xl font-bold mb-2">{banner.title}</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{banner.message}</p>

                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={handleDismissBanner}>
                            Close
                        </Button>
                        {banner.link && (
                            <Button onClick={() => {
                                handleDismissBanner()
                                window.location.href = banner.link!
                            }}>
                                Check it out
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
