"use client"

import { Share2, Link as LinkIcon, Facebook, Twitter, Check, MessageCircle, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { toast } from "sonner"

interface ShareButtonProps {
    title: string
    text?: string
    url?: string
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "")

    const handleShare = async () => {
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
            try {
                await navigator.share({
                    title,
                    text,
                    url: shareUrl,
                })
            } catch (error) {
                console.error("Error sharing:", error)
            }
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success("Link copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    const shareToSocial = (platform: "facebook" | "twitter" | "whatsapp") => {
        let socialUrl = ""
        switch (platform) {
            case "facebook":
                socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
                break
            case "twitter":
                socialUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`
                break
            case "whatsapp":
                socialUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`
                break
        }
        window.open(socialUrl, "_blank", "noopener,noreferrer")
    }

    // If native sharing is available (mostly mobile), show simple button
    // But we might want a consistent UI. Let's use Dropdown for desktop/fallback.
    // Actually, standard pattern: Main button tries native share on mobile, or opens dropdown on desktop.
    // But distinguishing mobile/desktop reliably in SSR is hard.
    // We'll use a Dropdown that has "Share via..." options.

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
                    Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareToSocial("whatsapp")}>
                    <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.19-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 7.33c-.16-.36-.33-.37-.48-.37-.15 0-.32 0-.49 0-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.42 1.02 2.58c.12.16 3.56 5.44 8.62 7.63.69.3 1.18.48 1.57.6.66.21 1.48.17 2.09.08.7-.1 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.54-.33-.28-.14-1.65-8.13-1.9-9.06-.23-.08-.4-.12-.56.12-.17.24-.68.86-.83 1.04-.15.19-.31.21-.59.07-.28-.14-1.19-.44-2.27-1.4-1.38-1.23-2.31-2.75-2.58-3.21-.27-.46-.03-.7.11-.84.25-.26.55-.66.75-.92.08-.11.1-.19.15-.31.05-.12.03-.23-.01-.31-.05-.09-.44-1.06-.6-1.46z" />
                    </svg>
                    WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareToSocial("facebook")}>
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareToSocial("twitter")}>
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                </DropdownMenuItem>
                {/* Native share option if supported? It's hard to conditionally render inside menu without layout shift. */}
                <DropdownMenuItem onClick={() => {
                    if (typeof navigator !== 'undefined' && 'share' in navigator) handleShare()
                    else toast("Native sharing not supported on this device")
                }}>
                    <Smartphone className="h-4 w-4 mr-2" />
                    Native Share (Mobile)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
