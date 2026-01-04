"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, startAfter, deleteDoc, doc, where, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { NewsForm } from "@/components/admin/news-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Edit, Trash2, Loader2, Newspaper, BookOpen, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

const ITEMS_PER_PAGE = 20

export default function NewsAndBlogsPage() {
    const [activeTab, setActiveTab] = useState<"news" | "blog">("news")
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any | null>(null)
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

            const collectionName = activeTab === "news"
                ? "artifacts/default-app-id/news"
                : "artifacts/default-app-id/blogs"

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

            const newItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))

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

    // Reset and fetch when tab changes
    useEffect(() => {
        setItems([])
        setLastVisible(null)
        setSearchQuery("")
        fetchItems(true)
    }, [activeTab])

    const filteredItems = items.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Delete "${title}"?`)) {
            try {
                const collectionName = activeTab === "news"
                    ? "artifacts/default-app-id/news"
                    : "artifacts/default-app-id/blogs"
                await deleteDoc(doc(db, collectionName, id))
                toast.success("Deleted successfully")
                setItems(prev => prev.filter(item => item.id !== id))
            } catch (error) {
                console.error("Error deleting:", error)
                toast.error("Failed to delete")
            }
        }
    }

    const handleEdit = (item: any) => {
        setSelectedItem(item)
        setIsDialogOpen(true)
    }

    const handleAddNew = () => {
        setSelectedItem(null)
        setIsDialogOpen(true)
    }

    const handleFormSuccess = () => {
        setIsDialogOpen(false)
        fetchItems(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">News & Blogs</h1>
                <Button variant="outline" size="icon" onClick={() => fetchItems(true)} title="Refresh">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "news" | "blog")} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="news" className="gap-2"><Newspaper className="h-4 w-4" /> News</TabsTrigger>
                        <TabsTrigger value="blog" className="gap-2"><BookOpen className="h-4 w-4" /> Blogs</TabsTrigger>
                    </TabsList>
                    <Button onClick={handleAddNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add {activeTab === "news" ? "News" : "Blog"}
                    </Button>
                </div>

                <div className="flex items-center gap-4 bg-background p-4 rounded-lg border mb-4">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search loaded ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md border-0 focus-visible:ring-0 bg-transparent pl-0"
                    />
                </div>

                <TabsContent value="news" className="border rounded-md bg-background mt-0">
                    <ItemsTable
                        items={filteredItems}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        type="news"
                    />
                </TabsContent>
                <TabsContent value="blog" className="border rounded-md bg-background mt-0">
                    <ItemsTable
                        items={filteredItems}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        type="blog"
                    />
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedItem ? "Edit" : "Create"} {activeTab === "news" ? "News Article" : "Blog Post"}</DialogTitle>
                    </DialogHeader>
                    <NewsForm
                        key={activeTab} // Reset form when tab changes
                        initialData={selectedItem}
                        type={activeTab}
                        onSuccess={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ItemsTable({ items, loading, onEdit, onDelete, type }: any) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    {type === "news" && <TableHead>Category</TableHead>}
                    <TableHead>Date</TableHead>
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
                ) : items.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                            No {type} posts found.
                        </TableCell>
                    </TableRow>
                ) : (
                    items.map((item: any) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <div className="relative h-12 w-20 overflow-hidden rounded bg-muted">
                                    <img src={item.imageUrl} alt={item.title} className="object-cover h-full w-full" />
                                </div>
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">
                                {item.title}
                                {item.isPromotion && <Badge variant="secondary" className="ml-2 text-[10px]">Promo</Badge>}
                            </TableCell>
                            <TableCell>{item.author}</TableCell>
                            {type === "news" && (
                                <TableCell>
                                    <Badge variant="outline">{item.category || "General"}</Badge>
                                </TableCell>
                            )}
                            <TableCell>
                                {item.updatedAt?.seconds ? format(new Date(item.updatedAt.seconds * 1000), "MMM d, yyyy") : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(item.id, item.title)} className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}
