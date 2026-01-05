"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, startAfter, deleteDoc, doc, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, MessageSquare, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Eye } from "lucide-react"

const ITEMS_PER_PAGE = 20

export default function ModerationPage() {
    const [activeTab, setActiveTab] = useState<"comments" | "reviews">("comments")
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [viewData, setViewData] = useState<{ title: string, content: string } | null>(null)
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null)
    const [hasMore, setHasMore] = useState(true)

    const fetchItems = async (isInitial = false) => {
        try {
            if (isInitial) {
                setLoading(true)
                setHasMore(true)
            } else {
                setLoadingMore(true)
            }

            const collectionName = activeTab === "comments"
                ? "artifacts/default-app-id/comments"
                : "artifacts/default-app-id/reviews"

            let q = query(
                collection(db, collectionName),
                orderBy("createdAt", "desc"),
                limit(ITEMS_PER_PAGE)
            )

            if (!isInitial && lastVisible) {
                q = query(
                    collection(db, collectionName),
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisible),
                    limit(ITEMS_PER_PAGE)
                )
            }

            const snapshot = await getDocs(q)
            let newItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

            // Resolve User Profiles
            const userIds = Array.from(new Set(newItems.map(i => i.userId || i.uid).filter(Boolean)))

            if (userIds.length > 0) {
                const userDocs = await Promise.all(
                    userIds.map(uid => getDoc(doc(db, "artifacts/default-app-id/users", uid)))
                )
                const userMap = new Map()
                userDocs.forEach(d => {
                    if (d.exists()) userMap.set(d.id, d.data())
                })

                newItems = newItems.map(item => {
                    const uid = item.userId || item.uid
                    const user = userMap.get(uid)
                    if (user) {
                        return {
                            ...item,
                            userName: user.displayName || user.name || item.userName || "Anonymous",
                            userImage: user.photoURL || user.image || null
                        }
                    }
                    return item
                })
            }

            if (isInitial) {
                setItems(newItems)
            } else {
                setItems(prev => [...prev, ...newItems])
            }

            setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null)

            if (snapshot.docs.length < ITEMS_PER_PAGE) {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error fetching items:", error)
            toast.error("Failed to load items")
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        setItems([])
        setLastVisible(null)
        fetchItems(true)
    }, [activeTab])

    const deleteItem = async (id: string) => {
        const itemType = activeTab === "comments" ? "Comment" : "Review"
        if (confirm(`Delete this ${itemType}?`)) {
            try {
                const collectionName = activeTab === "comments"
                    ? "artifacts/default-app-id/comments"
                    : "artifacts/default-app-id/reviews"

                await deleteDoc(doc(db, collectionName, id))
                toast.success(`${itemType} deleted`)
                setItems(prev => prev.filter(item => item.id !== id))
            } catch (error) {
                console.error("Error deleting:", error)
                toast.error("Failed to delete")
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Moderation</h1>
                <Button variant="outline" size="icon" onClick={() => fetchItems(true)} title="Refresh">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "comments" | "reviews")}>
                <TabsList>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="reviews">Movie Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="comments" className="mt-4">
                    <div className="border rounded-md bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Content</TableHead>
                                    <TableHead>Article</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No comments found.</TableCell></TableRow>
                                ) : (
                                    items.map(comment => (
                                        <TableRow key={comment.id}>
                                            <TableCell className="font-medium">{comment.userName || comment.username || "Anonymous"}</TableCell>
                                            <TableCell className="max-w-[400px] truncate">{comment.comment || comment.commentText || comment.text}</TableCell>
                                            <TableCell>
                                                <a href={`/${comment.articleType === 'blog' ? 'blog' : 'news'}/${comment.articleId}`} target="_blank" className="hover:underline text-primary">
                                                    {comment.articleTitle || comment.articleId}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setViewData({ title: "Comment Content", content: comment.comment || comment.commentText || comment.text })}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteItem(comment.id)} className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-4">
                    <div className="border rounded-md bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Review</TableHead>
                                    <TableHead>Movie ID</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No reviews found.</TableCell></TableRow>
                                ) : (
                                    items.map(review => (
                                        <TableRow key={review.id}>
                                            <TableCell className="font-medium">{review.userName || "Anonymous"}</TableCell>
                                            <TableCell className="max-w-[400px] truncate">{review.review}</TableCell>
                                            <TableCell>{review.movieId}</TableCell>
                                            <TableCell>{review.rating} ⭐</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setViewData({ title: "Review Content", content: review.review })}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteItem(review.id)} className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {!loading && hasMore && (
                    <div className="flex justify-center pt-4">
                        <Button variant="outline" onClick={() => fetchItems(false)} disabled={loadingMore}>
                            {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Load More
                        </Button>
                    </div>
                )}
            </Tabs>

            <Dialog open={!!viewData} onOpenChange={(open) => !open && setViewData(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{viewData?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
                        {viewData?.content}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
