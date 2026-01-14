"use client"

import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { Instagram, Facebook, Twitter, MessageCircle, Heart, Share2, MoreHorizontal, ExternalLink, LinkIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SocialPostCardProps {
    post: {
        id: string
        celebrityName: string
        platform: string
        content: string
        imageUrl?: string
        postUrl?: string
        postedAt: any // Timestrap
    }
}

export function SocialPostCard({ post }: SocialPostCardProps) {
    const getPlatformIcon = () => {
        switch (post.platform) {
            case 'instagram': return <Instagram className="w-5 h-5 text-pink-600" />
            case 'facebook': return <Facebook className="w-5 h-5 text-blue-600" />
            case 'twitter': return <Twitter className="w-5 h-5 text-black dark:text-white" />
            default: return <LinkIcon className="w-5 h-5 text-gray-500" />
        }
    }

    const getPlatformColor = () => {
        switch (post.platform) {
            case 'instagram': return "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]"
            case 'facebook': return "bg-blue-600 p-[2px]"
            default: return "bg-primary p-[2px]" // Default ring
        }
    }

    return (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("rounded-full", getPlatformColor())}>
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                            {/* Ideally, we'd have a celeb avatar here, but for now initials or placeholder */}
                            <span className="font-bold text-sm">{post.celebrityName.substring(0, 2).toUpperCase()}</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1">
                            <h3 className="font-semibold text-sm">{post.celebrityName}</h3>
                            <CheckCircle2 className="w-3 h-3 text-blue-500 fill-blue-500/10" />
                        </div>
                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                            {post.platform} • {post.postedAt?.toDate ? formatDistanceToNow(post.postedAt?.toDate(), { addSuffix: true }) : "Recently"}
                        </p>
                    </div>
                </div>
                {getPlatformIcon()}
            </div>

            {/* Content */}
            <div className="px-4 pb-2">
                <p className="text-sm whitespace-pre-wrap linkify">{post.content}</p>
            </div>

            {/* Image */}
            {post.imageUrl && (
                <div className="relative w-full aspect-square md:aspect-[4/3] bg-muted mt-2 border-y">
                    <Image
                        src={post.imageUrl}
                        alt={post.celebrityName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            )}

            {/* Footer / Actions */}
            <div className="p-3 flex items-center justify-between">
                <div className="flex gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                        <Heart className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Share2 className="w-5 h-5" />
                    </Button>
                </div>
                {post.postUrl && (
                    <Button variant="outline" size="sm" asChild className="text-xs h-8">
                        <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                            Visit Source <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                    </Button>
                )}
            </div>
        </div>
    )
}
