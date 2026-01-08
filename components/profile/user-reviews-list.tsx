"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc, Timestamp, limit, startAfter } from "firebase/firestore"
import { Loader2, Edit2, Trash2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function UserReviewsList() {
    const { user } = useAuth()
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [lastDoc, setLastDoc] = useState<any>(null)
    const [hasMore, setHasMore] = useState(true)
    const BATCH_SIZE = 4

    // Edit State
    const [editOpen, setEditOpen] = useState(false)
    const [currentReview, setCurrentReview] = useState<any>(null)
    const [editText, setEditText] = useState("")

    const fetchDetail = async (d: any) => {
        const data = d.data()
        let movieTitle = "Unknown Movie"
        if (data.movieId) {
            const mDoc = await getDoc(doc(db, "artifacts/default-app-id/movies", data.movieId))
            if (mDoc.exists()) movieTitle = mDoc.data().title
        }
        return { id: d.id, ...data, movieTitle }
    }

    const loadReviews = async (isInitial = false) => {
        if (!user) return

        if (isInitial) {
            setLoading(true)
            setHasMore(true)
        } else {
            setLoadingMore(true)
        }

        try {
            let q = query(
                collection(db, "artifacts/default-app-id/users", user.uid, "userReviews"),
                orderBy("createdAt", "desc"),
                limit(BATCH_SIZE)
            )

            if (!isInitial && lastDoc) {
                q = query(
                    collection(db, "artifacts/default-app-id/users", user.uid, "userReviews"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastDoc),
                    limit(BATCH_SIZE)
                )
            }

            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                if (isInitial) setReviews([])
                setHasMore(false)
                setLoading(false)
                setLoadingMore(false)
                return
            }

            setLastDoc(snapshot.docs[snapshot.docs.length - 1])
            if (snapshot.docs.length < BATCH_SIZE) setHasMore(false)

            const detailed = await Promise.all(snapshot.docs.map(fetchDetail))

            if (isInitial) {
                setReviews(detailed)
            } else {
                setReviews(prev => [...prev, ...detailed])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        loadReviews(true)
    }, [user])

    const handleDelete = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/reviews", reviewId))
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "userReviews", reviewId))
            toast.success("Review deleted")
            // Local update
            setReviews(prev => prev.filter(r => r.id !== reviewId))
        } catch (e: any) {
            toast.error("Failed to delete")
        }
    }

    const openEdit = (review: any) => {
        setCurrentReview(review)
        setEditText(review.reviewText)
        setEditOpen(true)
    }

    const handleUpdate = async () => {
        if (!currentReview || !user) return
        try {
            const updateData = {
                reviewText: editText,
                createdAt: Timestamp.now()
            }
            await updateDoc(doc(db, "artifacts/default-app-id/reviews", currentReview.id), updateData)
            await updateDoc(doc(db, "artifacts/default-app-id/users", user.uid, "userReviews", currentReview.id), updateData)
            toast.success("Review updated")
            setEditOpen(false)
            // Local update
            setReviews(prev => prev.map(r => r.id === currentReview.id ? { ...r, ...updateData } : r))
        } catch (e: any) {
            toast.error("Failed to update")
        }
    }

    if (loading) return <Loader2 className="animate-spin" />
    if (reviews.length === 0) return <p className="text-muted-foreground">No reviews yet.</p>

    return (
        <div className="space-y-4">
            {reviews.map(r => (
                <div key={r.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">{r.movieTitle}</p>
                            <div className="flex items-center gap-1 text-yellow-500 my-1">
                                <Star className="h-3 w-3 fill-current" />
                                <span className="text-xs font-bold">{r.rating}/5</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{new Date(r.createdAt.seconds * 1000).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <p className="mt-2 text-sm">{r.reviewText}</p>
                </div>
            ))}
            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={() => loadReviews(false)} disabled={loadingMore}>
                        {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Review</DialogTitle>
                    </DialogHeader>
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                    <DialogFooter>
                        <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
