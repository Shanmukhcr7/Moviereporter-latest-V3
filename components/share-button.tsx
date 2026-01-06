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
                        viewBox="0 0 448 512"
                        fill="currentColor"
                        className="h-4 w-4 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7C43.2 318.5 32 284.2 32 248.3c0-104.2 84.8-189 189-189 50.5 0 97.8 19.7 133.5 55.3 35.7 35.7 55.4 83 55.4 133.5.1 104.2-84.7 189-189 189zm101.9-141.7c-5.6-2.8-33-16.3-38-18.1-5.1-1.8-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18.1-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 33-13.4 37.6-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-4-10.5-6.7z" />
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
