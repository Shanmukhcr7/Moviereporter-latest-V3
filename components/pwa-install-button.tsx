"use client"

import { usePWAInstall } from "@/hooks/use-pwa-install"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface PWAInstallButtonProps {
    className?: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    showLabel?: boolean
}

export function PWAInstallButton({ className, variant = "outline", size = "default", showLabel = true }: PWAInstallButtonProps) {
    const { isInstallable, installPWA } = usePWAInstall()

    const handleClick = () => {
        if (isInstallable) {
            installPWA()
        } else {
            toast.info("To install the app:", {
                description: "Tap your browser's Share/Menu button and select 'Add to Home Screen' or 'Install App'."
            })
        }
    }

    return (
        <Button onClick={handleClick} variant={variant} size={size} className={className}>
            <Download className="h-4 w-4 mr-2" />
            {showLabel && "Download App"}
        </Button>
    )
}
