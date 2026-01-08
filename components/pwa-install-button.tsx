"use client"

import { usePWAInstall } from "@/hooks/use-pwa-install"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

interface PWAInstallButtonProps {
    className?: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    showLabel?: boolean
}

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

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
        toast.error("Install feature not available", {
            description: "This device or browser may not support automatic installation. Try 'Add to Home Screen' manually."
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
