"use client"

import { useEffect, useState } from "react"
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    increment,
    setDoc,
    Timestamp,
    orderBy,
    serverTimestamp,
    limit
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ThumbsUp, ThumbsDown, Share2, Calendar, User, MessageCircle, Edit, Trash, Bookmark, Check } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useParams } from "next/navigation"
import { FadeIn } from "@/components/animations/fade-in"
import Link from "next/link"

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"]

// Helper helper to safely format dates from Firestore Timestamp or Strings
const formatDate = (dateVal: any) => {
    if (!dateVal) return "Unknown Date";
    try {
        // Handle Firestore Timestamp
        if (dateVal.seconds !== undefined && dateVal.nanoseconds !== undefined) {
            return new Date(dateVal.seconds * 1000).toLocaleDateString();
        }
        // Handle specialized Firestore Timestamp object with toDate()
        if (typeof dateVal.toDate === 'function') {
            return dateVal.toDate().toLocaleDateString();
        }
        // Handle String
        return new Date(dateVal).toLocaleDateString();
    } catch (e) {
        return "Invalid Date";
    }
}

export function BlogClient({ initialId }: { initialId?: string }) {
    const params = useParams()
    const articleId = (initialId || params.id) as string

    const [article, setArticle] = useState<any>(null)
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState("")
    const [editingComment, setEditingComment] = useState<string | null>(null)
    const [editText, setEditText] = useState("")
    const [userFeedback, setUserFeedback] = useState<"like" | "dislike" | null>(null)
    const [isSaved, setIsSaved] = useState(false)
    const [showFullDescription, setShowFullDescription] = useState(false)
    const [loading, setLoading] = useState(true)
    const [relatedBlogs, setRelatedBlogs] = useState<any[]>([])
    const { user, userData } = useAuth()

    useEffect(() => {
        if (articleId) {
            fetchArticleDetails()
            fetchRelatedBlogs()
        }
    }, [articleId, user])

    const fetchRelatedBlogs = async () => {
        try {
            const q = query(
                collection(db, "artifacts/default-app-id/blogs"),
                orderBy("createdAt", "desc"),
                limit(5)
            )
            const snap = await getDocs(q)
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setRelatedBlogs(list.filter((b: any) => b.id !== articleId).slice(0, 4))
        } catch (e) {
            console.warn("Related blog error", e)
            const q2 = query(collection(db, "artifacts/default-app-id/blogs"), limit(5))
            const snap2 = await getDocs(q2)
            const list2 = snap2.docs.map(d => ({ id: d.id, ...d.data() }))
            setRelatedBlogs(list2.filter((b: any) => b.id !== articleId).slice(0, 4))
        }
    }

    const fetchArticleDetails = async () => {
        try {
            const articleDoc = await getDoc(doc(db, "artifacts/default-app-id/blogs", articleId))

            if (articleDoc.exists()) {
                const articleData = { id: articleDoc.id, ...articleDoc.data() }
                setArticle(articleData)

                // Fetch comments
                const commentsQuery = query(
                    collection(db, "artifacts/default-app-id/comments"),
                    where("articleId", "==", articleId),
                    where("articleType", "==", "blog"),
                    orderBy("createdAt", "asc")
                )
                const commentsSnapshot = await getDocs(commentsQuery)
                const commentsData = await Promise.all(commentsSnapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    let finalName = data.userName || data.username || data.name || "Anonymous";

                    // If name is Anonymous and belongs to current user, use their auth name or profile data
                    if ((!finalName || finalName === "Anonymous") && user && data.userId === user.uid) {
                        finalName = userData?.username || userData?.displayName || user.displayName || finalName;
                    }

                    // If name is Anonymous or missing, try to fetch from users collection
                    if ((!finalName || finalName === "Anonymous") && data.userId) {
                        try {
                            const userDoc = await getDoc(doc(db, "artifacts/default-app-id/users", data.userId));
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                finalName = userData.username || userData.name || userData.displayName || userData.firstName || finalName;
                            }
                        } catch (err) {
                            console.error("Error fetching user for comment:", err);
                        }
                    }

                    return {
                        id: docSnap.id,
                        ...data,
                        userName: finalName
                    };
                }));

                setComments(commentsData)

                if (user) {
                    // Check feedback
                    const feedbackDoc = await getDoc(doc(db, `artifacts/default-app-id/blogs/${articleId}/feedback`, user.uid))
                    if (feedbackDoc.exists()) {
                        setUserFeedback(feedbackDoc.data().type)
                    } else {
                        const legacyLike = await getDoc(doc(db, `artifacts/default-app-id/article-likes/${articleId}_${user.uid}`)) // Legacy check just in case
                        if (legacyLike.exists()) { // This is unlikely given new structure but good safety
                            setUserFeedback(legacyLike.data().type)
                        } else {
                            setUserFeedback(null)
                        }
                    }

                    // Check if saved
                    const savedDoc = await getDoc(doc(db, `artifacts/default-app-id/users/${user.uid}/savedBlogs`, articleId))
                    setIsSaved(savedDoc.exists())
                }
            }
        } catch (error) {
            console.error("[v0] Error fetching article details:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleFeedback = async (type: "like" | "dislike") => {
        if (!user || !article) return

        const feedbackRef = doc(db, `artifacts/default-app-id/blogs/${articleId}/feedback`, user.uid)
        const blogRef = doc(db, "artifacts/default-app-id/blogs", articleId)

        try {
            // If clicking same reaction, remove it (toggle off)
            if (userFeedback === type) {
                await deleteDoc(feedbackRef)
                await updateDoc(blogRef, {
                    [`${type}sCount`]: increment(-1)
                })

                setUserFeedback(null)
                setArticle((prev: any) => ({
                    ...prev,
                    [`${type}sCount`]: Math.max(0, (prev[`${type}sCount`] || 0) - 1)
                }))
                return
            }

            // If switching reaction (e.g. like -> dislike)
            const updates: any = {
                [`${type}sCount`]: increment(1)
            }
            if (userFeedback) {
                updates[`${userFeedback}sCount`] = increment(-1)
            }

            await Promise.all([
                setDoc(feedbackRef, { type, timestamp: serverTimestamp() }, { merge: true }),
                updateDoc(blogRef, updates)
            ])

            setArticle((prev: any) => {
                const newState = { ...prev }
                newState[`${type}sCount`] = (newState[`${type}sCount`] || 0) + 1
                if (userFeedback) {
                    newState[`${userFeedback}sCount`] = Math.max(0, (newState[`${userFeedback}sCount`] || 0) - 1)
                }
                return newState
            })
            setUserFeedback(type)

        } catch (error) {
            console.error("[v0] Error handling feedback:", error)
        }
    }

    const handleSave = async () => {
        if (!user || !article) return

        const savedRef = doc(db, `artifacts/default-app-id/users/${user.uid}/savedBlogs`, articleId)

        try {
            if (isSaved) {
                await deleteDoc(savedRef)
                setIsSaved(false)
            } else {
                await setDoc(savedRef, {
                    blogId: articleId,
                    savedAt: serverTimestamp()
                })
                setIsSaved(true)
            }
        } catch (error) {
            console.error("[v0] Error toggling save:", error)
        }
    }

    const handlePostComment = async () => {
        if (!user || !newComment.trim()) return

        try {
            const now = Timestamp.now()
            const commentData = {
                articleId: articleId,
                articleType: "blog",
                userId: user.uid,
                userName: user.displayName || "Anonymous",
                commentText: newComment,
                comment: newComment,
                createdAt: now.toDate().toISOString(),
                approved: true
            }

            const docRef = await addDoc(collection(db, "artifacts/default-app-id/comments"), commentData)

            // Sync to user private collection
            await setDoc(doc(db, `artifacts/default-app-id/users/${user.uid}/userComments`, docRef.id), {
                ...commentData,
                commentId: docRef.id
            })

            setNewComment("")
            fetchArticleDetails()
        } catch (error) {
            console.error("[v0] Error posting comment:", error)
        }
    }

    const handleEditComment = async (commentId: string) => {
        if (!editText.trim()) return

        try {
            const now = Timestamp.now()
            const updates = {
                comment: editText,
                commentText: editText,
                updatedAt: now.toDate().toISOString(),
                approved: true
            }

            await updateDoc(doc(db, "artifacts/default-app-id/comments", commentId), updates)

            if (user) {
                await updateDoc(doc(db, `artifacts/default-app-id/users/${user.uid}/userComments`, commentId), updates)
            }

            setEditingComment(null)
            setEditText("")
            fetchArticleDetails()
        } catch (error) {
            console.error("[v0] Error editing comment:", error)
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/comments", commentId))

            if (user) {
                await deleteDoc(doc(db, `artifacts/default-app-id/users/${user.uid}/userComments`, commentId))
            }

            fetchArticleDetails()
        } catch (error) {
            console.error("[v0] Error deleting comment:", error)
        }
    }

    const handleReaction = async (commentId: string, reaction: string) => {
        if (!user) return

        try {
            const commentDoc = await getDoc(doc(db, "artifacts/default-app-id/comments", commentId))
            if (commentDoc.exists()) {
                const data = commentDoc.data()
                const reactions = data.reactions || {}
                const userReactions = reactions[user.uid] || []

                let updatedReactions
                if (userReactions.includes(reaction)) {
                    updatedReactions = userReactions.filter((r: string) => r !== reaction)
                } else {
                    updatedReactions = [...userReactions, reaction]
                }

                await updateDoc(doc(db, "artifacts/default-app-id/comments", commentId), {
                    [`reactions.${user.uid}`]: updatedReactions,
                })
                fetchArticleDetails()
            }
        } catch (error) {
            console.error("[v0] Error handling reaction:", error)
        }
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.content?.substring(0, 100),
                url: window.location.href,
            })
        } else {
            navigator.clipboard.writeText(window.location.href)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <div className="container mx-auto px-4 py-12">
                    <div className="animate-pulse space-y-8">
                        <div className="h-96 bg-muted rounded-lg" />
                        <div className="h-64 bg-muted rounded-lg" />
                    </div>
                </div>
            </div>
        )
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-muted-foreground">Blog not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="container mx-auto px-4 py-12">
                <article className="max-w-4xl mx-auto">
                    <FadeIn>
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">{article.title}</h1>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{article.author || "Anonymous"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(article.scheduledAt || article.publishedAt || article.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="relative aspect-video overflow-hidden rounded-lg mb-8">
                            <Image
                                src={article.imageUrl || article.image || "/placeholder.svg"}
                                alt={article.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 800px"
                                className="object-cover"
                                onError={(e) => {
                                    // Fallback if the image URL is broken
                                    const target = e.target as HTMLImageElement;
                                    if (target.src.includes("placeholder.svg")) return; // Prevent infinite loop
                                    target.src = "/placeholder.svg";
                                }}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant={userFeedback === 'like' ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleFeedback('like')}
                                    disabled={!user}
                                >
                                    <ThumbsUp className="h-4 w-4 mr-2" />
                                    {article.likesCount || 0}
                                </Button>
                                <Button
                                    variant={userFeedback === 'dislike' ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleFeedback('dislike')}
                                    disabled={!user}
                                >
                                    <ThumbsDown className="h-4 w-4 mr-2" />
                                    {article.dislikesCount || 0}
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleShare}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                </Button>
                            </div>

                            {/* Save Button */}
                            <Button
                                variant={isSaved ? "default" : "outline"}
                                size="sm"
                                onClick={handleSave}
                                disabled={!user}
                            >
                                {isSaved ? <Check className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                                {isSaved ? "Saved" : "Save"}
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                            <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                {(() => {
                                    const content = (article.content || '').replace(/\\n/g, '\n');
                                    return showFullDescription ? content : `${content.substring(0, 800)}...`;
                                })()}
                            </p>
                            {(article.content || '').length > 800 && (
                                <Button variant="link" className="px-0 mt-4" onClick={() => setShowFullDescription(!showFullDescription)}>
                                    {showFullDescription ? "Show Less" : "Read More"}
                                </Button>
                            )}
                        </div>

                        {relatedBlogs.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold mb-6">Related Blogs</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {relatedBlogs.map((blog: any) => (
                                        <Link href={`/blog/${blog.id}`} key={blog.id} className="group block">
                                            <div className="flex gap-4 h-24">
                                                <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                                                    <Image
                                                        src={blog.imageUrl || blog.image || "/placeholder.svg"}
                                                        alt={blog.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                                        {blog.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatDate(blog.createdAt || blog.publishedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator className="my-12" />

                        {/* Comments Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <MessageCircle className="h-6 w-6" />
                                <h2 className="text-2xl font-bold">Comments</h2>
                                <Badge variant="secondary">{comments.length}</Badge>
                            </div>

                            {/* Post Comment */}
                            {user ? (
                                <Card className="mb-8">
                                    <CardContent className="p-6">
                                        <Textarea
                                            placeholder="Share your thoughts..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            rows={3}
                                            className="mb-4"
                                        />
                                        <Button onClick={handlePostComment} disabled={!newComment.trim()}>
                                            Post Comment
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="mb-8">
                                    <CardContent className="p-6 text-center">
                                        <p className="text-muted-foreground">Please login to comment</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Comments List */}
                            <div className="space-y-4">
                                {comments.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</p>
                                ) : (
                                    comments.map((comment) => (
                                        <Card key={comment.id}>
                                            <CardContent className="p-3">
                                                <div className="flex items-start justify-between mb-1.5">
                                                    <div>
                                                        <p className="font-semibold text-sm">
                                                            {comment.userName || comment.username || comment.name || "Anonymous"}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {formatDate(comment.createdAt)}
                                                        </p>
                                                    </div>
                                                    {user && user.uid === comment.userId && (
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={() => {
                                                                    setEditingComment(comment.id)
                                                                    setEditText(comment.comment || comment.commentText)
                                                                }}
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteComment(comment.id)}>
                                                                <Trash className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                {editingComment === comment.id ? (
                                                    <div className="space-y-2">
                                                        <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className="min-h-[60px]" />
                                                        <div className="flex gap-2">
                                                            <Button size="sm" onClick={() => handleEditComment(comment.id)} className="h-7 text-xs">
                                                                Save
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => setEditingComment(null)} className="h-7 text-xs">
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm mb-1.5 whitespace-pre-wrap leading-tight">{comment.comment || comment.commentText}</p>

                                                        {/* Reactions */}
                                                        <div className="flex gap-1 flex-wrap">
                                                            {REACTIONS.map((reaction) => {
                                                                const reactionCount = Object.values(comment.reactions || {}).filter((r: any) =>
                                                                    r.includes(reaction),
                                                                ).length
                                                                const userReacted = user && comment.reactions?.[user.uid]?.includes(reaction)

                                                                return (
                                                                    <Button
                                                                        key={reaction}
                                                                        variant={userReacted ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => handleReaction(comment.id, reaction)}
                                                                        disabled={!user}
                                                                        className="h-6 px-1.5 text-xs gap-1"
                                                                    >
                                                                        <span>{reaction}</span>
                                                                        {reactionCount > 0 && <span className="opacity-70">{reactionCount}</span>}
                                                                    </Button>
                                                                )
                                                            })}
                                                        </div>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </FadeIn>
                </article>
            </main>
        </div>
    )
}
