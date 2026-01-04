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
                    <MessageCircle className="h-4 w-4 mr-2" />
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
