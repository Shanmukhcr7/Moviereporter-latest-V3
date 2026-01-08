"use client"

import { useState, useEffect } from "react"

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isInstallable, setIsInstallable] = useState(false)

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)
            console.log("PWA event captured by hook")
        }

        // Check if event already fired and was captured globally
        if ((window as any).pwaDeferredPrompt) {
            console.log("Found global PWA event")
            setDeferredPrompt((window as any).pwaDeferredPrompt)
            setIsInstallable(true)
                ; (window as any).pwaDeferredPrompt = null // Consume it
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => {
            window.removeEventListener("beforeinstallprompt", handler)
        }
    }, [])

    const installPWA = async () => {
        if (!deferredPrompt) return

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt')
            setDeferredPrompt(null)
            setIsInstallable(false)
        } else {
            console.log('User dismissed the install prompt')
        }
    }

    return { isInstallable, installPWA }
}
