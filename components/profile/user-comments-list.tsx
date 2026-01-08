"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc, Timestamp, limit, startAfter } from "firebase/firestore"
import { Loader2, Edit2, Trash2 } from "lucide-react"
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

export function UserCommentsList() {
    const { user } = useAuth()
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [lastDoc, setLastDoc] = useState<any>(null)
    const [hasMore, setHasMore] = useState(true)
    const BATCH_SIZE = 4

    // Edit State
    const [editOpen, setEditOpen] = useState(false)
    const [currentComment, setCurrentComment] = useState<any>(null)
    const [editText, setEditText] = useState("")

    const fetchDetail = async (d: any) => {
        const data = d.data()
        let articleTitle = "Unknown Article"

        if (data.articleId && data.articleType) {
            const coll = data.articleType === 'news' ? 'news' : 'blogs' // Legacy mapping
            const artDoc = await getDoc(doc(db, "artifacts/default-app-id", coll, data.articleId))
            if (artDoc.exists()) articleTitle = artDoc.data().title
        }
        return { id: d.id, ...data, articleTitle }
    }

    const loadComments = async (isInitial = false) => {
        if (!user) return

        if (isInitial) {
            setLoading(true)
            setHasMore(true)
        } else {
            setLoadingMore(true)
        }

        try {
            let q = query(
                collection(db, "artifacts/default-app-id/users", user.uid, "userComments"),
                orderBy("createdAt", "desc"),
                limit(BATCH_SIZE)
            )

            if (!isInitial && lastDoc) {
                q = query(
                    collection(db, "artifacts/default-app-id/users", user.uid, "userComments"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastDoc),
                    limit(BATCH_SIZE)
                )
            }

            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                if (isInitial) setComments([])
                setHasMore(false)
                setLoading(false)
                setLoadingMore(false)
                return
            }

            setLastDoc(snapshot.docs[snapshot.docs.length - 1])
            if (snapshot.docs.length < BATCH_SIZE) setHasMore(false)

            const detailed = await Promise.all(snapshot.docs.map(fetchDetail))

            if (isInitial) {
                setComments(detailed)
            } else {
                setComments(prev => [...prev, ...detailed])
            }

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        loadComments(true)
    }, [user])

    const handleDelete = async (commentId: string) => {
        // Legacy deletes from both 'comments' (public) and 'userComments' (private)
        if (!confirm("Are you sure you want to delete this comment?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/comments", commentId))
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "userComments", commentId))
            toast.success("Comment deleted")
            // Reload to refresh list correctly or filter out
            setComments(prev => prev.filter(c => c.id !== commentId))
        } catch (e: any) {
            toast.error("Failed to delete")
        }
    }

    const openEdit = (comment: any) => {
        setCurrentComment(comment)
        setEditText(comment.commentText)
        setEditOpen(true)
    }

    const handleUpdate = async () => {
        if (!currentComment || !user) return
        try {
            const updateData = {
                commentText: editText,
                createdAt: Timestamp.now(), // update time
                approved: true
            }
            await updateDoc(doc(db, "artifacts/default-app-id/comments", currentComment.id), updateData)
            await updateDoc(doc(db, "artifacts/default-app-id/users", user.uid, "userComments", currentComment.id), updateData)
            toast.success("Comment updated")
            setEditOpen(false)
            // Update local state instead of full reload to keep pagination
            setComments(prev => prev.map(c => c.id === currentComment.id ? { ...c, ...updateData } : c))
        } catch (e: any) {
            toast.error("Failed to update")
        }
    }

    if (loading) return <Loader2 className="animate-spin" />
    if (comments.length === 0) return <p className="text-muted-foreground">No comments yet.</p>

    return (
        <div className="space-y-4">
            {comments.map(c => (
                <div key={c.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold line-clamp-1">{c.articleTitle}</p>
                            <p className="text-sm text-muted-foreground">
                                {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : "Just now"}
                            </p>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <p className="mt-2 text-sm">{c.commentText}</p>
                </div>
            ))}
            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={() => loadComments(false)} disabled={loadingMore}>
                        {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Comment</DialogTitle>
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
