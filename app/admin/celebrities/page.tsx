"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, startAfter, deleteDoc, doc, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { CelebrityForm } from "@/components/admin/celebrity-form"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit, Trash2, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { AdminSearch } from "@/components/admin/admin-search"

const ITEMS_PER_PAGE = 5

export default function CelebritiesPage() {
  const [celebrities, setCelebrities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCeleb, setSelectedCeleb] = useState<any | null>(null)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Search
  const [searchIndex, setSearchIndex] = useState<{ id: string, label: string, value: string }[]>([])
  const [filteredCelebrities, setFilteredCelebrities] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const fetchCelebrities = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true)
        setHasMore(true)
        setIsSearching(false)
      } else {
        setLoadingMore(true)
      }

      let q = query(
        collection(db, "artifacts/default-app-id/celebrities"),
        orderBy("name", "asc"),
        limit(ITEMS_PER_PAGE)
      )

      if (!isInitial && lastVisible && !isSearching) {
        q = query(
          collection(db, "artifacts/default-app-id/celebrities"),
          orderBy("name", "asc"),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        )
      }

      const snapshot = await getDocs(q)

      const newCelebrities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      if (isInitial) {
        setCelebrities(newCelebrities)
        setFilteredCelebrities(newCelebrities)
      } else {
        setCelebrities(prev => [...prev, ...newCelebrities])
        setFilteredCelebrities(prev => [...prev, ...newCelebrities])
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null)

      if (snapshot.docs.length < ITEMS_PER_PAGE) {
        setHasMore(false)
      }

    } catch (error) {
      console.error("Error fetching celebrities:", error)
      toast.error("Failed to load celebrities")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    const fetchSearchIndex = async () => {
      const q = query(collection(db, "artifacts/default-app-id/celebrities"), orderBy("name"))
      const snapshot = await getDocs(q)
      const index = snapshot.docs.map(d => ({
        id: d.id,
        label: d.data().name,
        value: d.id
      }))
      setSearchIndex(index)
    }
    fetchSearchIndex()
  }, [])

  useEffect(() => {
    fetchCelebrities(true)
  }, [])

  const handleSearchSelect = async (id: string) => {
    setLoading(true)
    setIsSearching(true)
    try {
      const local = celebrities.find(c => c.id === id)
      if (local) {
        setFilteredCelebrities([local])
        setLoading(false)
        return
      }

      const { getDoc } = await import("firebase/firestore")
      const docRef = doc(db, "artifacts/default-app-id/celebrities", id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setFilteredCelebrities([{ id: docSnap.id, ...docSnap.data() }])
      }
    } catch (e) {
      toast.error("Error finding celebrity")
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setIsSearching(false)
    setFilteredCelebrities(celebrities)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "artifacts/default-app-id/celebrities", id))
        toast.success("Celebrity deleted")
        setCelebrities(prev => prev.filter(c => c.id !== id))
        setFilteredCelebrities(prev => prev.filter(c => c.id !== id))
      } catch (error) {
        console.error("Error deleting:", error)
        toast.error("Failed to delete")
      }
    }
  }

  const handleEdit = (celeb: any) => {
    setSelectedCeleb(celeb)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setSelectedCeleb(null)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    fetchCelebrities(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Celebrities Management</h1>
          <p className="text-muted-foreground">Manage actors, directors, and crew members.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchCelebrities(true)} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" /> Add Celebrity
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-background p-4 rounded-lg border">
        <div className="flex-1 max-w-sm">
          <AdminSearch
            items={searchIndex}
            onSelect={handleSearchSelect}
            placeholder="Search celebrities..."
          />
        </div>
        {isSearching && (
          <Button variant="ghost" onClick={handleClearSearch}>Clear Search</Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
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
            ) : filteredCelebrities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No celebrities found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCelebrities.map((celeb) => (
                <TableRow key={celeb.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={celeb.imageUrl} className="object-cover" />
                      <AvatarFallback className="bg-primary/10">{celeb.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{celeb.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                      {celeb.role}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-muted-foreground text-sm">
                    {celeb.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(celeb)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(celeb.id, celeb.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
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

      {!loading && hasMore && !isSearching && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => fetchCelebrities(false)} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCeleb ? "Edit Celebrity" : "Add New Celebrity"}</DialogTitle>
          </DialogHeader>
          <CelebrityForm
            initialData={selectedCeleb}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div >
  )
}
