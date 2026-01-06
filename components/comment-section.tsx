"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp, limit, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, MessageCircle, Send, X } from "lucide-react"
import { toast } from "sonner"
import { FadeIn } from "@/components/animations/fade-in"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CommentSectionProps {
    articleId: string
    articleTitle?: string
}

export function CommentSection({ articleId, articleTitle }: CommentSectionProps) {
    const { user } = useAuth()
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [activeReactionId, setActiveReactionId] = useState<string | null>(null)
    const [longPressTimer, setLongPressTimer] = useState<any>(null)

    const handleReaction = async (commentId: string, reaction: string) => {
        if (!user) {
            toast.error("Login to react")
            return
        }

        try {
            const commentRef = doc(db, "artifacts/default-app-id/article_comments", commentId)
            const commentDoc = await getDoc(commentRef)

            if (commentDoc.exists()) {
                const data = commentDoc.data()
                const reactions = data.reactions || {}
                const userReactions = reactions[user.uid] || []

                let updated
                if (userReactions.includes(reaction)) {
                    updated = userReactions.filter((r: string) => r !== reaction)
                } else {
                    updated = [...userReactions, reaction]
                }

                // Optimistic update
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            reactions: {
                                ...(c.reactions || {}),
                                [user.uid]: updated
                            }
                        }
                    }
                    return c
                }))

                await updateDoc(commentRef, {
                    [`reactions.${user.uid}`]: updated
                })
            }
        } catch (error) {
            console.error("Error reacting:", error)
            toast.error("Failed to react")
            fetchComments() // Revert
        }
    }

    useEffect(() => {
        if (articleId) fetchComments()
    }, [articleId])

    const fetchComments = async () => {
        try {
            const q = query(
                collection(db, "artifacts/default-app-id/article_comments"),
                where("articleId", "==", articleId),
                orderBy("createdAt", "desc"),
                limit(50)
            )

            // Safety check for index: if failed, try without orderBy first
            try {
                const snapshot = await getDocs(q)
                setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            } catch (e) {
                // Fallback for missing index
                const qFallback = query(
                    collection(db, "artifacts/default-app-id/article_comments"),
                    where("articleId", "==", articleId)
                )
                const snapshot = await getDocs(qFallback)
                // Client side sort
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                data.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds)
                setComments(data)
            }

        } catch (error) {
            console.error("Error fetching comments:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast.error("Please login to comment")
            return
        }
        if (!newComment.trim()) return

        setSubmitting(true)
        try {
            await addDoc(collection(db, "artifacts/default-app-id/article_comments"), {
                articleId,
                articleTitle: articleTitle || "Unknown Article",
                userId: user.uid,
                userName: user.displayName || "Anonymous",
                userImage: user.photoURL,
                text: newComment.trim(),
                createdAt: Timestamp.now(),
                likes: 0
            })

            setNewComment("")
            toast.success("Comment posted!")
            fetchComments()
        } catch (error) {
            console.error("Error posting comment:", error)
            toast.error("Failed to post comment")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/article_comments", commentId))
            setComments(prev => prev.filter(c => c.id !== commentId))
            toast.success("Comment deleted")
        } catch (error) {
            console.error("Error deleting comment:", error)
            toast.error("Failed to delete")
        }
    }

    return (
        <div className="space-y-6 mt-12 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4 border-b pb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-bold">Discussion ({comments.length})</h3>
            </div>

            {/* Input */}
            <Card className="border-border/50 bg-muted/20">
                <CardContent className="p-4">
                    {user ? (
                        <form onSubmit={handleSubmit} className="flex gap-4">
                            <Avatar className="h-10 w-10 mt-1">
                                <AvatarImage src={user.photoURL || undefined} />
                                <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <Textarea
                                    placeholder="Share your thoughts..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="min-h-[80px] bg-background"
                                />
                                <div className="flex justify-end">
                                    <Button size="sm" type="submit" disabled={submitting || !newComment.trim()}>
                                        {submitting ? "Posting..." : <><Send className="h-4 w-4 mr-2" /> Post Comment</>}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-muted-foreground mb-4">Join the conversation to share your thoughts.</p>
                            {/* We assume there is a global login modal trigger or redirect. For now, just a message. */}
                            <Button variant="outline" onClick={() => toast("Please use the login button in the header.")}>Login to Comment</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading discussion...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-lg">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No comments yet. Be the first to start the discussion!</p>
                    </div>
                ) : (
                    comments.map((comment, i) => (
                        <FadeIn key={comment.id} delay={i * 0.05}>
                            <div
                                className="flex gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors group relative select-none"
                                onContextMenu={(e) => e.preventDefault()}
                                onTouchStart={() => {
                                    const timer = setTimeout(() => setActiveReactionId(comment.id), 500)
                                    setLongPressTimer(timer)
                                }}
                                onTouchEnd={() => {
                                    if (longPressTimer) clearTimeout(longPressTimer)
                                }}
                                onMouseDown={() => {
                                    const timer = setTimeout(() => setActiveReactionId(comment.id), 500)
                                    setLongPressTimer(timer)
                                }}
                                onMouseUp={() => {
                                    if (longPressTimer) clearTimeout(longPressTimer)
                                }}
                                onMouseLeave={() => {
                                    if (longPressTimer) clearTimeout(longPressTimer)
                                }}
                            >
                                {activeReactionId === comment.id && (
                                    <div className="absolute -top-10 left-10 bg-background border shadow-lg rounded-full p-2 flex gap-2 z-50 animate-in zoom-in slide-in-from-bottom-2">
                                        {["👍", "❤️", "😂", "😮", "😢", "🔥"].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReaction(comment.id, emoji);
                                                    setActiveReactionId(null);
                                                }}
                                                className={cn("hover:scale-125 transition-transform text-xl",
                                                    comment.reactions?.[user?.uid || ""]?.includes(emoji) ? "opacity-100" : "opacity-70 hover:opacity-100"
                                                )}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                        <button onClick={() => setActiveReactionId(null)} className="ml-2 text-muted-foreground hover:text-foreground">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={comment.userImage} />
                                    <AvatarFallback>{comment.userName?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <span className="font-semibold text-sm mr-2">{comment.userName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleDateString() : "Just now"}
                                            </span>
                                        </div>
                                        {user && user.uid === comment.userId && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(comment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.text}</p>

                                    {/* Reactions Display */}
                                    {comment.reactions && Object.values(comment.reactions).some((r: any) => r && r.length > 0) && (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {["👍", "❤️", "😂", "😮", "😢", "🔥"].filter(emoji =>
                                                Object.values(comment.reactions).some((r: any) => r?.includes(emoji))
                                            ).map(emoji => {
                                                const count = Object.values(comment.reactions).filter((r: any) => r?.includes(emoji)).length;
                                                return (
                                                    <Badge key={emoji} variant="secondary" className="text-[10px] px-1 py-0 h-5 gap-1 cursor-pointer" onClick={() => handleReaction(comment.id, emoji)}>
                                                        <span>{emoji}</span>
                                                        <span>{count}</span>
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {i < comments.length - 1 && <div className="h-px bg-border/40 my-2" />}
                        </FadeIn>
                    ))
                )}
            </div>
        </div>
    )
}
