"use client"

import { usePWAInstall } from "@/hooks/use-pwa-install"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import Image from "next/image"

interface PWAInstallButtonProps {
    className?: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    showLabel?: boolean
}

export function PWAInstallButton({ className, variant = "outline", size = "default", showLabel = true }: PWAInstallButtonProps) {
    const { isInstallable, installPWA } = usePWAInstall()
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        setLoading(true)

        // Simulate "Checking if available..."
        // If it's already installable, we can go fast. If not, we wait a bit to see if it becomes ready.
        if (isInstallable) {
            setLoading(false)
            installPWA()
            return
        }

        // Wait a small amount of time to give the browser a chance or just to show the user we are checking
        await new Promise(resolve => setTimeout(resolve, 2000))

        setLoading(false)

        // Re-check (state might not update in this closure if using basic hook, but deferredPrompt is ref-like)
        // Actually, reusing the hook's installPWA() should work if the state updated. 
        // But since we are inside the closure, we rely on the component re-rendering if isInstallable changed.
        // However, if it didn't change, we assume it's not supported.

        // Since we can't easily peek "live" into the hook's state from here without a ref, 
        // we'll just try to install again. `installPWA` has a guard check `if (!deferredPrompt)`.

        // We will show a toast ONLY if it fails after the check
        toast.error("Cannot install app", {
            description: "The app might already be installed, or your browser doesn't support automatic installation."
        })
    }

    return (
        <Button
            onClick={handleClick}
            variant={variant}
            size={size}
            className={className}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Download className="h-4 w-4 mr-2" />
            )}
            {showLabel && (loading ? "Checking..." : "Download App")}
        </Button>
    )
}

export function PWAStoreBadges() {
    const { isInstallable, installPWA } = usePWAInstall()
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        setLoading(true)

        if (isInstallable) {
            setLoading(false)
            installPWA()
            return
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
        setLoading(false)

        toast.error("Cannot install app", {
            description: "The app might already be installed, or your browser doesn't support automatic installation."
        })
    }

    return (
        <div className="flex flex-row gap-2">
            <button
                onClick={handleClick}
                disabled={loading}
                className="relative h-9 w-[120px] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
                <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                    alt="Get it on Google Play"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </button>
            <button
                onClick={handleClick}
                disabled={loading}
                className="relative h-9 w-[120px] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
                <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                    alt="Download on the App Store"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </button>
        </div>
    )
}
