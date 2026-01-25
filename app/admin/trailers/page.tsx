"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { TrailerForm } from "@/components/admin/trailer-form"
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
import { Plus, Edit, Trash2, Loader2, PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import Image from "next/image"

export default function TrailersPage() {
    const [trailers, setTrailers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedTrailer, setSelectedTrailer] = useState<any | null>(null)

    useEffect(() => {
        const q = query(collection(db, "artifacts/default-app-id/trailers"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setTrailers(results)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this trailer?")) {
            try {
                // Fetch doc first to get image URL for deletion
                const { getDoc } = await import("firebase/firestore")
                const docRef = doc(db, "artifacts/default-app-id/trailers", id)
                const snap = await getDoc(docRef)
                const thumbnailUrl = snap.data()?.thumbnailUrl

                if (thumbnailUrl) {
                    try {
                        await fetch("/api/delete-file", {
                            method: "POST",
                            body: JSON.stringify({ url: thumbnailUrl })
                        })
                    } catch (e) {
                        console.error("Failed to delete thumbnail:", e)
                    }
                }

                await deleteDoc(docRef)
                toast.success("Trailer deleted")
            } catch (error) {
                console.error("Error deleting:", error)
                toast.error("Failed to delete")
            }
        }
    }

    const handleEdit = (trailer: any) => {
        setSelectedTrailer(trailer)
        setIsDialogOpen(true)
    }

    const handleAddNew = () => {
        setSelectedTrailer(null)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Latest Trailers</h1>
                    <p className="text-muted-foreground">Manage movie trailers and teasers.</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" /> Add Trailer
                </Button>
            </div>

            <div className="border rounded-md bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Thumbnail</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Duration / Link</TableHead>
                            <TableHead>Featured</TableHead>
                            <TableHead>Added Date</TableHead>
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
                        ) : trailers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                    No trailers added yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            trailers.map((trailer) => (
                                <TableRow key={trailer.id}>
                                    <TableCell>
                                        <div className="relative w-24 h-14 rounded overflow-hidden bg-muted group">
                                            {trailer.thumbnailUrl ? (
                                                <Image src={trailer.thumbnailUrl} alt="Thumbnail" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs">No Img</div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <PlayCircle className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {trailer.title}
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <a href={trailer.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate block">
                                            {trailer.youtubeUrl}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        {trailer.isFeatured ? (
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">Yes</span>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {trailer.createdAt ? format(trailer.createdAt.toDate(), "PP") : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(trailer)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(trailer.id)} className="text-destructive hover:text-destructive">
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
                        <DialogTitle>{selectedTrailer ? "Edit Trailer" : "Add New Trailer"}</DialogTitle>
                    </DialogHeader>
                    <TrailerForm
                        initialData={selectedTrailer}
                        onSuccess={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
