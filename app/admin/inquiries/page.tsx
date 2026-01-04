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
import { Loader2, Trash2, Mail, MessageCircle, FileText, Phone, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye } from "lucide-react"

const ITEMS_PER_PAGE = 20

export default function InquiriesPage() {
    const [activeTab, setActiveTab] = useState<"promotions" | "feedback">("promotions")
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

            const collectionName = activeTab === "promotions"
                ? "artifacts/default-app-id/promotion_inquiries"
                : "artifacts/default-app-id/feedback"

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
            const newItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

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
        const itemType = activeTab === "promotions" ? "Inquiry" : "Feedback"
        if (confirm(`Delete this ${itemType}?`)) {
            try {
                const collectionName = activeTab === "promotions"
                    ? "artifacts/default-app-id/promotion_inquiries"
                    : "artifacts/default-app-id/feedback"

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
                <h1 className="text-3xl font-bold">Inquiries & Feedback</h1>
                <Button variant="outline" size="icon" onClick={() => fetchItems(true)} title="Refresh">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "promotions" | "feedback")}>
                <TabsList>
                    <TabsTrigger value="promotions">Promotion Requests</TabsTrigger>
                    <TabsTrigger value="feedback">User Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="promotions" className="mt-4">
                    <div className="border rounded-md bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="w-[40%]">Message</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No promotion inquiries yet.</TableCell></TableRow>
                                ) : (
                                    items.map(promo => (
                                        <TableRow key={promo.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {promo.createdAt?.toDate ? new Date(promo.createdAt.toDate()).toLocaleDateString() : "Recent"}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div>{promo.name}</div>
                                                {promo.company && <div className="text-xs text-muted-foreground">{promo.company}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <a href={`mailto:${promo.email}`} className="flex items-center gap-1 hover:underline text-primary">
                                                        <Mail className="h-3 w-3" /> {promo.email}
                                                    </a>
                                                    {promo.mobile && (
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Phone className="h-3 w-3" /> {promo.mobile}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[400px]">
                                                <div className="line-clamp-3 text-sm">{promo.message}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setViewData({ title: "Promotion Inquiry", content: promo.message })}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteItem(promo.id)} className="text-destructive">
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

                <TabsContent value="feedback" className="mt-4">
                    <div className="border rounded-md bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="w-[40%]">Message</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No feedback found.</TableCell></TableRow>
                                ) : (
                                    items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : "Recent"}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.userName || item.email || "Anonymous"}
                                            </TableCell>
                                            <TableCell>{item.subject || "General Feedback"}</TableCell>
                                            <TableCell className="max-w-[400px]">
                                                <div className="line-clamp-3 text-sm">{item.message || item.feedback}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setViewData({ title: "User Feedback", content: item.message || item.feedback })}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="text-destructive">
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
