"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, startAfter, deleteDoc, doc, where, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { MovieForm } from "@/components/admin/movie-form"
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
import { Plus, Edit, Trash2, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { AdminSearch } from "@/components/admin/admin-search"

const ITEMS_PER_PAGE = 5

export default function MoviesPage() {
  const [movies, setMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Search Index
  const [searchIndex, setSearchIndex] = useState<{ id: string, label: string, value: string }[]>([])
  const [filteredMovies, setFilteredMovies] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const fetchMovies = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true)
        setHasMore(true) // Reset hasMore on fresh load
        setIsSearching(false) // Reset search mode
      } else {
        setLoadingMore(true)
      }

      let q = query(
        collection(db, "artifacts/default-app-id/movies"),
        orderBy("createdAt", "desc"),
        limit(ITEMS_PER_PAGE)
      )

      if (!isInitial && lastVisible && !isSearching) {
        q = query(
          collection(db, "artifacts/default-app-id/movies"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        )
      }

      const snapshot = await getDocs(q)
      const newMovies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      if (isInitial) {
        setMovies(newMovies)
        setFilteredMovies(newMovies)
      } else {
        setMovies(prev => [...prev, ...newMovies])
        setFilteredMovies(prev => [...prev, ...newMovies])
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null)

      if (snapshot.docs.length < ITEMS_PER_PAGE) {
        setHasMore(false)
      }

    } catch (error) {
      console.error("Error fetching movies:", error)
      toast.error("Failed to load movies")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Fetch Search Index (All items lightweight)
  useEffect(() => {
    const fetchSearchIndex = async () => {
      const q = query(collection(db, "artifacts/default-app-id/movies"), orderBy("title"))
      const snapshot = await getDocs(q)
      const index = snapshot.docs.map(d => ({
        id: d.id,
        label: d.data().title,
        value: d.id // Value can be ID or slug
      }))
      setSearchIndex(index)
    }
    fetchSearchIndex()
  }, [])

  useEffect(() => {
    fetchMovies(true)
  }, [])

  const handleSearchSelect = async (movieId: string) => {
    setLoading(true)
    setIsSearching(true)
    try {
      // If selected existing loaded, filter locally
      const local = movies.find(m => m.id === movieId)
      if (local) {
        setFilteredMovies([local])
        setLoading(false)
        return
      }

      // Else fetch specific
      const { getDoc } = await import("firebase/firestore") // dynamic import
      const docRef = doc(db, "artifacts/default-app-id/movies", movieId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setFilteredMovies([{ id: docSnap.id, ...docSnap.data() }])
      }
    } catch (error) {
      toast.error("Error finding movie")
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setIsSearching(false)
    setFilteredMovies(movies)
  }

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, "artifacts/default-app-id/movies", id))
        toast.success("Movie deleted")
        setMovies(prev => prev.filter(m => m.id !== id))
        setFilteredMovies(prev => prev.filter(m => m.id !== id))
      } catch (error) {
        console.error("Error deleting:", error)
        toast.error("Failed to delete")
      }
    }
  }

  const handleEdit = (movie: any) => {
    setSelectedMovie(movie)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setSelectedMovie(null)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    fetchMovies(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Movies Management</h1>
          <p className="text-muted-foreground">Add new releases, update box office, and manage content.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchMovies(true)} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" /> Add Movie
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-background p-4 rounded-lg border">
        <div className="flex-1 max-w-sm">
          <AdminSearch
            items={searchIndex}
            onSelect={handleSearchSelect}
            placeholder="Search movies..."
          />
        </div>
        {isSearching && (
          <Button variant="ghost" onClick={handleClearSearch}>Clear Search</Button>
        )}
      </div>

      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Poster</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Release Date</TableHead>
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
            ) : filteredMovies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No movies found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMovies.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell>
                    <div className="relative h-12 w-8 overflow-hidden rounded bg-muted">
                      <img src={movie.posterUrl} alt={movie.title} className="object-cover h-full w-full" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {movie.title}
                    <div className="text-xs text-muted-foreground">{movie.genre}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                      {movie.industry}
                    </span>
                  </TableCell>
                  <TableCell>
                    {movie.releaseDate?.toDate ? format(movie.releaseDate.toDate(), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(movie)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(movie.id, movie.title)} className="text-destructive hover:text-destructive">
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
          <Button variant="outline" onClick={() => fetchMovies(false)} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMovie ? "Edit Movie" : "Add New Movie"}</DialogTitle>
          </DialogHeader>
          <MovieForm
            initialData={selectedMovie}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
