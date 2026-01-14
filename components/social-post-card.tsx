"use client"

import { useState, FormEvent } from "react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { Instagram, Facebook, Twitter, MessageCircle, Heart, Share2, ExternalLink, LinkIcon, CheckCircle2, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { doc, updateDoc, arrayUnion, arrayRemove, increment, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Comment {
    userId: string
    userName: string
    text: string
    createdAt: any
}

interface SocialPostCardProps {
    post: {
        id: string
        celebrityName: string
        platform: string
        content: string
        imageUrl?: string
        postUrl?: string
        postedAt: any
        likes?: number
        likedBy?: string[]
        comments?: Comment[]
    }
}

export function SocialPostCard({ post }: SocialPostCardProps) {
    const { user, userData } = useAuth()
    const [isLiked, setIsLiked] = useState(post.likedBy?.includes(user?.uid || "") || false)
    const [likesCount, setLikesCount] = useState(post.likes || 0)
    const [showComments, setShowComments] = useState(false)
    const [commentText, setCommentText] = useState("")
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)
    const [localComments, setLocalComments] = useState<Comment[]>(post.comments || [])

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
            default: return "bg-primary p-[2px]"
        }
    }

    const handleLike = async () => {
        if (!user) {
            toast.error("Please login to like posts")
            return
        }

        // Optimistic update
        const newIsLiked = !isLiked
        setIsLiked(newIsLiked)
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1)

        const postRef = doc(db, "artifacts/default-app-id/social_posts", post.id)
        try {
            if (newIsLiked) {
                await updateDoc(postRef, {
                    likes: increment(1),
                    likedBy: arrayUnion(user.uid)
                })
            } else {
                await updateDoc(postRef, {
                    likes: increment(-1),
                    likedBy: arrayRemove(user.uid)
                })
            }
        } catch (error) {
            console.error("Error updating like:", error)
            // Revert on error
            setIsLiked(!newIsLiked)
            setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1)
            toast.error("Failed to update like")
        }
    }

    const handleShare = async () => {
        const shareData = {
            title: `Check out this post by ${post.celebrityName}`,
            text: post.content,
            url: window.location.href // Or maybe a specific link to the post if we had individual pages
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                console.log("Share canceled")
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(shareData.url)
            toast.success("Link copied to clipboard!")
        }
    }

    const handleComment = async (e: FormEvent) => {
        e.preventDefault()
        if (!user || !commentText.trim()) return

        setIsSubmittingComment(true)
        const newComment: Comment = {
            userId: user.uid,
            userName: userData?.displayName || "User",
            text: commentText,
            createdAt: Timestamp.now()
        }

        try {
            const postRef = doc(db, "artifacts/default-app-id/social_posts", post.id)
            await updateDoc(postRef, {
                comments: arrayUnion(newComment)
            })

            setLocalComments([...localComments, newComment])
            setCommentText("")
            toast.success("Comment posted")
        } catch (error) {
            console.error("Error commenting:", error)
            toast.error("Failed to post comment")
        } finally {
            setIsSubmittingComment(false)
        }
    }

    return (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("rounded-full", getPlatformColor())}>
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
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

            {/* Info Bar */}
            <div className="px-4 py-2 text-xs text-muted-foreground flex justify-between border-b border-border/50">
                <span>{likesCount} Likes</span>
                <span>{localComments.length} Comments</span>
            </div>

            {/* Footer / Actions */}
            <div className="p-2 flex items-center justify-between">
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-2 hover:text-red-500", isLiked && "text-red-500")}
                        onClick={handleLike}
                    >
                        <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                        <span className="sr-only">Like</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowComments(!showComments)}
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="sr-only">Comment</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={handleShare}
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="sr-only">Share</span>
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

            {/* Comments Section */}
            {showComments && (
                <div className="bg-muted/30 p-4 border-t animate-in slide-in-from-top-2">
                    {/* Comment List */}
                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                        {localComments.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
                        )}
                        {localComments.map((comment, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-sm">
                                <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-[10px]">{comment.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-background p-2 rounded-lg border">
                                    <span className="font-semibold text-xs block">{comment.userName}</span>
                                    <p className="text-xs mt-0.5">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    {user ? (
                        <form onSubmit={handleComment} className="flex gap-2">
                            <Input
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="h-9 text-sm"
                                disabled={isSubmittingComment}
                            />
                            <Button size="icon" className="h-9 w-9" type="submit" disabled={isSubmittingComment || !commentText.trim()}>
                                {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                            Please login to comment.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
