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
    limit,
    serverTimestamp
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { ShareButton } from "@/components/share-button"
import { CommentSection } from "@/components/comment-section"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ThumbsUp, ThumbsDown, Calendar, User, Bookmark, Check } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useParams } from "next/navigation"
import { FadeIn } from "@/components/animations/fade-in"
import Link from "next/link"

export function NewsClient({ initialId }: { initialId?: string }) {
    const params = useParams()
    // Use initialId if provided (from server params), fallback to params.id (client nav)
    const articleId = (initialId || params.id) as string

    const [article, setArticle] = useState<any>(null)
    const [userFeedback, setUserFeedback] = useState<"like" | "dislike" | null>(null)
    const [isSaved, setIsSaved] = useState(false)
    const [showFullDescription, setShowFullDescription] = useState(false)
    const [loading, setLoading] = useState(true)
    const [recentNews, setRecentNews] = useState<any[]>([])
    const { user, userData } = useAuth()

    useEffect(() => {
        if (articleId) {
            fetchArticleDetails()
            incrementViewCount()
            fetchRecentNews()
        }
    }, [articleId, user])

    const fetchRecentNews = async () => {
        try {
            const q = query(
                collection(db, "artifacts/default-app-id/news"),
                orderBy("createdAt", "desc"),
                limit(5)
            )
            const snap = await getDocs(q)
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setRecentNews(list.filter((n: any) => n.id !== articleId).slice(0, 4))
        } catch (e) {
            console.warn("Recent news sort error, fallback", e)
            const q2 = query(collection(db, "artifacts/default-app-id/news"), limit(5))
            const snap2 = await getDocs(q2)
            const list2 = snap2.docs.map(d => ({ id: d.id, ...d.data() }))
            setRecentNews(list2.filter((n: any) => n.id !== articleId).slice(0, 4))
        }
    }

    const incrementViewCount = async () => {
        const storageKey = `viewed_news_${articleId}`
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey)) return

        try {
            const newsRef = doc(db, "artifacts/default-app-id/news", articleId)
            await updateDoc(newsRef, {
                views: increment(1)
            })
            if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(storageKey, "true")
        } catch (e) {
            console.error("Error incrementing view:", e)
        }
    }

    const fetchArticleDetails = async () => {
        try {
            const articleDoc = await getDoc(doc(db, "artifacts/default-app-id/news", articleId))

            if (articleDoc.exists()) {
                const articleData = { id: articleDoc.id, ...articleDoc.data() }
                setArticle(articleData)

                // Check if user liked/disliked
                if (user) {
                    const feedbackDoc = await getDoc(doc(db, `artifacts/default-app-id/news/${articleId}/feedback`, user.uid))
                    if (feedbackDoc.exists()) {
                        setUserFeedback(feedbackDoc.data().type)
                    } else {
                        setUserFeedback(null)
                    }

                    // Check if saved
                    const savedDoc = await getDoc(doc(db, `artifacts/default-app-id/users/${user.uid}/savedNews`, articleId))
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

        const feedbackRef = doc(db, `artifacts/default-app-id/news/${articleId}/feedback`, user.uid)
        const newsRef = doc(db, "artifacts/default-app-id/news", articleId)

        try {
            // If clicking same reaction, remove it (toggle off)
            if (userFeedback === type) {
                await setDoc(feedbackRef, { type: null }, { merge: true })
                await updateDoc(newsRef, {
                    [`${type}sCount`]: increment(-1)
                })

                setUserFeedback(null)
                // Update local state count optimistically
                setArticle((prev: any) => ({
                    ...prev,
                    [`${type}sCount`]: Math.max(0, (prev[`${type}sCount`] || 0) - 1)
                }))
                return
            }

            // If switching reaction (e.g. like -> dislike)
            // Decrease old count, increase new count
            const updates: any = {
                [`${type}sCount`]: increment(1)
            }
            if (userFeedback) {
                updates[`${userFeedback}sCount`] = increment(-1)
            }

            await Promise.all([
                setDoc(feedbackRef, { type }, { merge: true }),
                updateDoc(newsRef, updates)
            ])

            // Optimistic update
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

        const savedRef = doc(db, `artifacts/default-app-id/users/${user.uid}/savedNews`, articleId)

        try {
            if (isSaved) {
                await deleteDoc(savedRef)
                setIsSaved(false)
            } else {
                await setDoc(savedRef, {
                    newsId: articleId,
                    savedAt: serverTimestamp()
                })
                setIsSaved(true)
            }
        } catch (error) {
            console.error("[v0] Error toggling save:", error)
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
                    <p className="text-muted-foreground">Article not found</p>
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
                            {article.category && (
                                <Badge className="mb-4" variant="secondary">
                                    {article.category}
                                </Badge>
                            )}
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">{article.title}</h1>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{article.author || "Anonymous"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {(() => {
                                            const dateVal = article.scheduledAt || article.publishedAt || article.createdAt;
                                            if (!dateVal) return "Unknown Date"
                                            if (typeof dateVal.toDate === 'function') return dateVal.toDate().toLocaleDateString()
                                            return new Date(dateVal).toLocaleDateString()
                                        })()}
                                    </span>
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
                                <ShareButton title={article.title} text={article.summary || article.title} />
                            </div>

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

                        {/* Summary */}
                        {article.summary && (
                            <div className="mb-8 p-4 bg-muted/50 rounded-lg border-l-4 border-primary italic">
                                {article.summary}
                            </div>
                        )}

                        {/* Content */}
                        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                            <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                {showFullDescription ? article.content : `${article.content?.substring(0, 800)}...`}
                            </p>
                            {article.content?.length > 800 && (
                                <Button variant="link" className="px-0 mt-4" onClick={() => setShowFullDescription(!showFullDescription)}>
                                    {showFullDescription ? "Show Less" : "Read More"}
                                </Button>
                            )}
                        </div>

                        {recentNews.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold mb-6">Recent News</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {recentNews.map((news: any) => (
                                        <Link href={`/news/${news.id}`} key={news.id} className="group block">
                                            <div className="flex gap-4 h-24">
                                                <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                                                    <Image
                                                        src={news.imageUrl || news.image || "/placeholder.svg"}
                                                        alt={news.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                                        {news.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {news.publishedAt ? new Date(news.publishedAt.seconds ? news.publishedAt.seconds * 1000 : news.publishedAt).toLocaleDateString() : "Recent"}
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
                        <CommentSection articleId={articleId} articleTitle={article.title} />
                    </FadeIn>
                </article>
            </main>
        </div>
    )
}
