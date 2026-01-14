"use client"

import { useState, FormEvent, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Instagram, Facebook, Twitter, MessageCircle, Heart, Share2, ExternalLink, LinkIcon, CheckCircle2, Send, Loader2, MoreVertical, Trash2, Edit2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { doc, updateDoc, arrayUnion, arrayRemove, increment, Timestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

interface Comment {
    id: string
    userId: string
    userName: string
    userPhoto?: string
    text: string
    createdAt: any
    updatedAt?: any
}

interface SocialPostCardProps {
    post: {
        id: string
        celebrityName: string
        celebrityImage?: string
        platform: string
        content: string
        imageUrl?: string
        postUrl?: string
        postedAt: any
        likes?: number
        likedBy?: string[]
        comments?: Comment[]
    }
    isDetailView?: boolean
}

const MAX_COMMENT_LENGTH = 500
const READ_MORE_LENGTH = 250

export function SocialPostCard({ post, isDetailView = false }: SocialPostCardProps) {
    const { user, userData } = useAuth()
    const router = useRouter()
    const [isLiked, setIsLiked] = useState(post.likedBy?.includes(user?.uid || "") || false)
    const [likesCount, setLikesCount] = useState(post.likes || 0)
    const [showComments, setShowComments] = useState(isDetailView)

    // Comment State
    const [commentText, setCommentText] = useState("")
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)
    const [localComments, setLocalComments] = useState<Comment[]>(post.comments || [])
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
    const [editCommentText, setEditCommentText] = useState("")

    // Content State
    const [isExpanded, setIsExpanded] = useState(false)
    const isLongContent = post.content.length > READ_MORE_LENGTH

    // Ensure we don't have broken comments (legacy data compatibility)
    useEffect(() => {
        if (post.comments) {
            setLocalComments(post.comments.map(c => ({
                ...c,
                id: c.id || Math.random().toString(36).substr(2, 9)
            })))
        }
    }, [post.comments])

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

    const handleCardClick = (e: React.MouseEvent) => {
        if (!isDetailView) {
            router.push(`/celebrity-social/${post.id}`)
        }
    }

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) {
            toast.error("Please login to like posts")
            return
        }

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
            setIsLiked(!newIsLiked)
            setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1)
            toast.error("Failed to update like")
        }
    }

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation()
        const shareData = {
            title: `Check out this post by ${post.celebrityName}`,
            text: post.content,
            url: window.location.href
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                console.log("Share canceled")
            }
        } else {
            navigator.clipboard.writeText(shareData.url)
            toast.success("Link copied to clipboard!")
        }
    }

    const handleCommentToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShowComments(!showComments)
    }

    const handleComment = async (e: FormEvent) => {
        e.preventDefault()
        if (!user || !commentText.trim()) return

        if (commentText.length > MAX_COMMENT_LENGTH) {
            toast.error(`Comment must be under ${MAX_COMMENT_LENGTH} characters`)
            return
        }

        setIsSubmittingComment(true)
        const newComment: Comment = {
            id: crypto.randomUUID(),
            userId: user.uid,
            userName: userData?.displayName || "User",
            userPhoto: user.photoURL || userData?.photoURL || undefined,
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

    const handleDeleteComment = async (commentId: string) => {
        try {
            const updatedLocal = localComments.filter(c => c.id !== commentId)
            setLocalComments(updatedLocal)

            const postRef = doc(db, "artifacts/default-app-id/social_posts", post.id)
            const docSnap = await getDoc(postRef)

            if (docSnap.exists()) {
                const currentComments = docSnap.data().comments || []
                const newComments = currentComments.filter((c: any) => c.id !== commentId)
                await updateDoc(postRef, { comments: newComments })
                toast.success("Comment deleted")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete comment")
        }
    }

    const startEdit = (comment: Comment) => {
        setEditingCommentId(comment.id)
        setEditCommentText(comment.text)
    }

    const saveEdit = async (commentId: string) => {
        if (!editCommentText.trim()) return

        try {
            setLocalComments(prev => prev.map(c => c.id === commentId ? { ...c, text: editCommentText, updatedAt: new Date() } : c))
            setEditingCommentId(null)

            const postRef = doc(db, "artifacts/default-app-id/social_posts", post.id)
            const docSnap = await getDoc(postRef)

            if (docSnap.exists()) {
                const currentComments = docSnap.data().comments || []
                const newComments = currentComments.map((c: any) => {
                    if (c.id === commentId) {
                        return { ...c, text: editCommentText, updatedAt: Timestamp.now() }
                    }
                    return c
                })
                await updateDoc(postRef, { comments: newComments })
                toast.success("Comment updated")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to update comment")
        }
    }

    return (
        <div
            className={cn(
                "bg-card border rounded-xl overflow-hidden shadow-sm transition-shadow relative",
                !isDetailView && "hover:shadow-md cursor-pointer"
            )}
            onClick={handleCardClick}
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("rounded-full", getPlatformColor())}>
                        <Avatar className="w-10 h-10 border-2 border-background">
                            <AvatarImage src={post.celebrityImage} className="object-cover" />
                            <AvatarFallback className="bg-background font-bold text-sm">
                                {post.celebrityName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
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
                <p className="text-sm whitespace-pre-wrap linkify">
                    {isExpanded || !isLongContent ? post.content : `${post.content.substring(0, READ_MORE_LENGTH)}...`}
                    {isLongContent && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="text-primary hover:underline ml-1 text-xs font-semibold"
                        >
                            {isExpanded ? "Show less" : "Read more"}
                        </button>
                    )}
                </p>
            </div>

            {/* Content Image */}
            {post.imageUrl && (
                <div className={cn("relative w-full bg-muted mt-2 border-y", isDetailView ? "aspect-auto min-h-[300px]" : "aspect-square md:aspect-[4/3]")}>
                    <Image
                        src={post.imageUrl}
                        alt={post.celebrityName}
                        fill={!isDetailView}
                        width={isDetailView ? 800 : undefined}
                        height={isDetailView ? 600 : undefined}
                        className={cn("object-cover", isDetailView ? "w-full h-auto max-h-[600px] object-contain bg-black/5" : "")}
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
                        onClick={handleCommentToggle}
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
                    <Button variant="outline" size="sm" asChild className="text-xs h-8" onClick={(e) => e.stopPropagation()}>
                        <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                            Visit Source <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                    </Button>
                )}
            </div>

            {/* Comments Section */}
            {(showComments || isDetailView) && (
                <div className="bg-muted/30 p-4 border-t animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                    {/* Comment List */}
                    <div className={cn("space-y-4 mb-4 pr-2", !isDetailView && "max-h-60 overflow-y-auto")}>
                        {localComments.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
                        )}
                        {localComments.map((comment, idx) => (
                            <div key={comment.id || idx} className="flex gap-2 items-start text-sm group">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={comment.userPhoto} />
                                    <AvatarFallback className="text-xs">{comment.userName ? comment.userName.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-background p-3 rounded-lg border shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs opacity-90">{comment.userName}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : "Just now"}
                                                {comment.updatedAt && " (edited)"}
                                            </span>
                                        </div>

                                        {user?.uid === comment.userId && editingCommentId !== comment.id && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => startEdit(comment)}>
                                                        <Edit2 className="h-3 w-3 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteComment(comment.id)}>
                                                        <Trash2 className="h-3 w-3 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>

                                    {editingCommentId === comment.id ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={editCommentText}
                                                onChange={(e) => setEditCommentText(e.target.value)}
                                                className="min-h-[60px] text-sm"
                                                maxLength={MAX_COMMENT_LENGTH}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                                <Button size="sm" onClick={() => saveEdit(comment.id)}>Save</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    {user ? (
                        <div className="sticky bottom-0 bg-background/50 backdrop-blur-sm p-2 rounded-md border space-y-2">
                            <form onSubmit={handleComment} className="flex gap-2">
                                <Input
                                    placeholder="Add a comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="h-10 text-sm"
                                    disabled={isSubmittingComment}
                                    maxLength={MAX_COMMENT_LENGTH}
                                />
                                <Button size="icon" className="h-10 w-10 shrink-0" type="submit" disabled={isSubmittingComment || !commentText.trim()}>
                                    {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </form>
                            <div className="text-[10px] text-muted-foreground text-right px-1">
                                {commentText.length} / {MAX_COMMENT_LENGTH}
                            </div>
                        </div>
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
