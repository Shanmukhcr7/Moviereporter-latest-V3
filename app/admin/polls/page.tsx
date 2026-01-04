"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { PollForm } from "@/components/admin/poll-form"
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
import { Plus, Edit, Trash2, Loader2, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function PollsPage() {
    const [polls, setPolls] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedPoll, setSelectedPoll] = useState<any | null>(null)

    useEffect(() => {
        const q = query(collection(db, "artifacts/default-app-id/polls"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setPolls(results)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this poll?")) {
            try {
                await deleteDoc(doc(db, "artifacts/default-app-id/polls", id))
                toast.success("Poll deleted")
            } catch (error) {
                console.error("Error deleting:", error)
                toast.error("Failed to delete")
            }
        }
    }

    const handleEdit = (poll: any) => {
        setSelectedPoll(poll)
        setIsDialogOpen(true)
    }

    const handleAddNew = () => {
        setSelectedPoll(null)
        setIsDialogOpen(true)
    }

    const isActive = (poll: any) => {
        const now = new Date()
        return now >= poll.startDate?.toDate() && now <= poll.endDate?.toDate()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Polls</h1>
                    <p className="text-muted-foreground">Manage audience polls and voting.</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" /> Create Poll
                </Button>
            </div>

            <div className="border rounded-md bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead>Options</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : polls.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    No polls created yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            polls.map((poll) => (
                                <TableRow key={poll.id}>
                                    <TableCell className="font-medium max-w-[300px]">
                                        {poll.question}
                                    </TableCell>
                                    <TableCell>
                                        {poll.options.length} Options
                                        <div className="text-xs text-muted-foreground">Total Votes: {poll.totalVotes || 0}</div>
                                    </TableCell>
                                    <TableCell>
                                        {isActive(poll) ? (
                                            <Badge className="bg-green-500">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Closed</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {poll.endDate ? format(poll.endDate.toDate(), "MMM d, yyyy") : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(poll)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(poll.id)} className="text-destructive hover:text-destructive">
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedPoll ? "Edit Poll" : "Create Poll"}</DialogTitle>
                    </DialogHeader>
                    <PollForm
                        initialData={selectedPoll}
                        onSuccess={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
