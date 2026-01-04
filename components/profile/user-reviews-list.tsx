"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
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

    // Edit State
    const [editOpen, setEditOpen] = useState(false)
    const [currentReview, setCurrentReview] = useState<any>(null)
    const [editText, setEditText] = useState("")

    const loadReviews = async () => {
        if (!user) return
        setLoading(true)
        try {
            const q = query(collection(db, "artifacts/default-app-id/users", user.uid, "userReviews"), orderBy("createdAt", "desc"))
            const snapshot = await getDocs(q)

            const detailed = await Promise.all(snapshot.docs.map(async (d) => {
                const data = d.data()
                let movieTitle = "Unknown Movie"
                if (data.movieId) {
                    const mDoc = await getDoc(doc(db, "artifacts/default-app-id/movies", data.movieId))
                    if (mDoc.exists()) movieTitle = mDoc.data().title
                }
                return { id: d.id, ...data, movieTitle }
            }))
            setReviews(detailed)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadReviews()
    }, [user])

    const handleDelete = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/reviews", reviewId))
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "userReviews", reviewId))
            toast.success("Review deleted")
            loadReviews()
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
            loadReviews()
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
                            <p className="font-semibold text-lg">{r.movieTitle}</p>
                            <div className="flex items-center gap-1 text-amber-500">
                                {Array.from({ length: r.rating || 0 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {new Date(r.createdAt?.toDate ? r.createdAt.toDate() : r.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <p className="mt-2 text-sm italic">"{r.reviewText}"</p>
                </div>
            ))}

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Review</DialogTitle>
                    </DialogHeader>
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} />
                    <DialogFooter>
                        <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
