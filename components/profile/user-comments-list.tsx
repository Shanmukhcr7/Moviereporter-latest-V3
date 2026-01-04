"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
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

    // Edit State
    const [editOpen, setEditOpen] = useState(false)
    const [currentComment, setCurrentComment] = useState<any>(null)
    const [editText, setEditText] = useState("")

    const loadComments = async () => {
        if (!user) return
        setLoading(true)
        try {
            const q = query(collection(db, "artifacts/default-app-id/users", user.uid, "userComments"), orderBy("createdAt", "desc"))
            const snapshot = await getDocs(q)

            const detailed = await Promise.all(snapshot.docs.map(async (d) => {
                const data = d.data()
                let articleTitle = "Unknown Article"
                // naive check for collection? Legacy used articleType field 'news' or 'blog'
                // Assuming data.articleType exists
                if (data.articleId && data.articleType) {
                    const coll = data.articleType === 'news' ? 'news' : 'blogs'
                    const artDoc = await getDoc(doc(db, "artifacts/default-app-id", coll, data.articleId))
                    if (artDoc.exists()) articleTitle = artDoc.data().title
                }
                return { id: d.id, ...data, articleTitle }
            }))
            setComments(detailed)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadComments()
    }, [user])

    const handleDelete = async (commentId: string) => {
        // Legacy deletes from both 'comments' (public) and 'userComments' (private)
        if (!confirm("Are you sure you want to delete this comment?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/comments", commentId))
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "userComments", commentId))
            toast.success("Comment deleted")
            loadComments()
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
            loadComments()
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
                            <p className="font-semibold text-sm">On: {c.articleTitle}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(c.createdAt?.toDate ? c.createdAt.toDate() : c.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <p className="mt-2 text-sm">{c.commentText}</p>
                </div>
            ))}

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Comment</DialogTitle>
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
