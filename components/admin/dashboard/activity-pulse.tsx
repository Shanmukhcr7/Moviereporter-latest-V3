"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Eye, Trash2, CheckCircle, MessageSquare, Star, BadgeAlert } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ActivityPulse() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5 text-blue-500" />
                    Activity Pulse
                </CardTitle>
                <CardDescription>Real-time updates from users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="reviews">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        <TabsTrigger value="comments">Comments</TabsTrigger>
                        <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
                    </TabsList>
                    <TabsContent value="reviews">
                        <ActivityList collectionName="reviews" type="review" />
                    </TabsContent>
                    <TabsContent value="comments">
                        <ActivityList collectionName="comments" type="comment" />
                    </TabsContent>
                    <TabsContent value="inquiries">
                        <ActivityList collectionName="promotion_inquiries" type="inquiry" />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

function ActivityList({ collectionName, type }: { collectionName: string, type: string }) {
    const [items, setItems] = useState<any[]>([])
    const [viewItem, setViewItem] = useState<any | null>(null)

    useEffect(() => {
        const q = query(collection(db, `artifacts/default-app-id/${collectionName}`), orderBy("createdAt", "desc"), limit(6))

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const rawItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

            // Enrich with user details if name is missing/Anonymous but userId exists
            const enrichedItems = await Promise.all(rawItems.map(async (item: any) => {
                let currentName = item.userName || item.username || item.user_name || item.name || "Anonymous"

                // If generic name and we have a userId, try to find better info
                if ((currentName === "Anonymous" || !currentName) && item.userId) {
                    try {
                        const userSnap = await getDoc(doc(db, "artifacts/default-app-id/users", item.userId))
                        if (userSnap.exists()) {
                            const userData = userSnap.data()
                            // Try username, then displayName, then combine first/last
                            const betterName = userData.username ||
                                userData.displayName ||
                                (userData.firstName ? `${userData.firstName} ${userData.lastName || ""}`.trim() : null)

                            if (betterName) currentName = betterName
                        }
                    } catch (err) {
                        // Fail silently and keep "Anonymous"
                        console.log("Failed to enrich user", err)
                    }
                }

                return { ...item, userName: currentName }
            }))

            setItems(enrichedItems)
        })
        return () => unsubscribe()
    }, [collectionName])

    const handleDelete = async (id: string) => {
        if (confirm("Delete this item?")) {
            await deleteDoc(doc(db, `artifacts/default-app-id/${collectionName}`, id))
            toast.success("Item deleted")
        }
    }

    return (
        <div className="space-y-4 mt-4">
            {items.length === 0 && <p className="text-muted-foreground text-center py-4">No recent activity.</p>}
            {items.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex gap-3 overflow-hidden">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{(item.userName || item.username || item.user_name || item.name || "?")[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">{item.userName || item.username || item.user_name || item.name || "Anonymous"}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {item.createdAt?.toDate ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : "just now"}
                                </span>
                            </div>

                            {type === 'review' && (
                                <div className="flex items-center gap-1 text-amber-500 text-xs">
                                    <Star className="h-3 w-3 fill-current" /> {item.rating}
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                                {item.review || item.comment || item.message || item.text}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => setViewItem(item)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}

            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View {type}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="border p-4 rounded-md bg-muted/30">
                            {viewItem?.review || viewItem?.comment || viewItem?.message || viewItem?.text}
                        </div>
                        {type === 'inquiry' && (
                            <div className="text-sm space-y-1">
                                <p><strong>Email:</strong> {viewItem?.email}</p>
                                <p><strong>Mobile:</strong> {viewItem?.mobile || "N/A"}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ActivityIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
