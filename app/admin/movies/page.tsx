"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Plus, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Movie {
  id: string
  title: string
  poster: string
  releaseDate: string
  industry: string
  rating: number
  status: string
}

function AdminMoviesContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const q = query(collection(db, "movies"), orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(q)
        const moviesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Movie[]
        setMovies(moviesData)
        setFilteredMovies(moviesData)
      } catch (error) {
        console.error("Error fetching movies:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.role === "admin") {
      fetchMovies()
    }
  }, [user])

  useEffect(() => {
    const filtered = movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.industry.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredMovies(filtered)
  }, [searchTerm, movies])

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this movie?")) {
      try {
        await deleteDoc(doc(db, "movies", id))
        setMovies(movies.filter((m) => m.id !== id))
      } catch (error) {
        console.error("Error deleting movie:", error)
        alert("Failed to delete movie")
      }
    }
  }

  if (loading || !user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Movies Management</h1>
            <p className="text-muted-foreground">Manage all movies in the database</p>
          </div>
          <Link href="/admin/movies/new">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add New Movie
            </Button>
          </Link>
        </div>

        <Card className="p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search movies by title or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMovies.map((movie) => (
              <Card key={movie.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  <Image
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    width={100}
                    height={150}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{movie.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded text-sm">{movie.industry}</span>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded text-sm">
                        ⭐ {movie.rating}/10
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-sm">
                        {movie.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Release: {movie.releaseDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/movies/${movie.id}`}>
                      <Button variant="outline" size="icon">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(movie.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredMovies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No movies found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminMoviesPage() {
  return (
    <Suspense fallback={null}>
      <AdminMoviesContent />
    </Suspense>
  )
}
