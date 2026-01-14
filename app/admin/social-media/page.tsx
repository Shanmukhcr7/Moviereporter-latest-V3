"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SocialPostForm } from "@/components/admin/social-post-form"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Loader2, ExternalLink, Instagram, Facebook, Twitter, LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import Image from "next/image"

export default function SocialMediaPage() {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedPost, setSelectedPost] = useState<any | null>(null)

    useEffect(() => {
        const q = query(collection(db, "artifacts/default-app-id/social_posts"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setPosts(results)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this post?")) {
            try {
                await deleteDoc(doc(db, "artifacts/default-app-id/social_posts", id))
                toast.success("Post deleted")
            } catch (error) {
                console.error("Error deleting:", error)
                toast.error("Failed to delete")
            }
        }
    }

    const handleEdit = (post: any) => {
        setSelectedPost(post)
        setIsDialogOpen(true)
    }

    const handleAddNew = () => {
        setSelectedPost(null)
        setIsDialogOpen(true)
    }

    const getIcon = (platform: string) => {
        switch (platform) {
            case 'instagram': return <Instagram className="w-4 h-4" />
            case 'facebook': return <Facebook className="w-4 h-4" />
            case 'twitter': return <Twitter className="w-4 h-4" />
            default: return <LinkIcon className="w-4 h-4" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Celebrity Social</h1>
                    <p className="text-muted-foreground">Manage social media updates and posts.</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" /> New Post
                </Button>
            </div>

            <div className="border rounded-md bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Celebrity</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Posted Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : posts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                    No posts found. Create one!
                                </TableCell>
                            </TableRow>
                        ) : (
                            posts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell>
                                        <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                                            {post.imageUrl ? (
                                                <Image src={post.imageUrl} alt="Post" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Img</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {post.celebrityName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 capitalize">
                                            {getIcon(post.platform)}
                                            {post.platform}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <p className="truncate text-sm text-muted-foreground">{post.content}</p>
                                    </TableCell>
                                    <TableCell>
                                        {post.postedAt ? format(post.postedAt.toDate(), "PP") : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {post.postUrl && (
                                                <Button variant="ghost" size="icon" asChild title="View Original">
                                                    <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="text-destructive hover:text-destructive">
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedPost ? "Edit Social Post" : "New Social Post"}</DialogTitle>
                    </DialogHeader>
                    <SocialPostForm
                        initialData={selectedPost}
                        onSuccess={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
