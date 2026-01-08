"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { collection, query, limit, getDocs, startAfter, orderBy, doc, getDoc, setDoc, updateDoc, increment, startAt, endAt } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Users, Search, Sparkles } from "lucide-react"
import { Header } from "@/components/header"
import { CelebritySearch } from "@/components/celebrity-search"
import { CelebrityCard } from "@/components/celebrity-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { FadeIn } from "@/components/animations/fade-in"

export default function CelebritiesPage() {
  const [celebrities, setCelebrities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)

  // Favorites state
  const { user } = useAuth()
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
  const [favLoading, setFavLoading] = useState<Set<string>>(new Set())

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCelebrities()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (user) fetchUserFavorites()
    else setUserFavorites(new Set())
  }, [user])

  const fetchUserFavorites = async () => {
    if (!user) return
    try {
      const favsRef = collection(db, `artifacts/default-app-id/users/${user.uid}/favoritesCelebrities`)
      const snapshot = await getDocs(favsRef)
      const favIds = new Set<string>()
      snapshot.forEach(doc => {
        if (doc.data().isFavorite) favIds.add(doc.id)
      })
      setUserFavorites(favIds)
    } catch (error) {
      console.error("Error fetching favorites:", error)
    }
  }

  const fetchCelebrities = async (loadMore = false) => {
    const cacheKey = "celebrities_initial_list"
    if (!loadMore && !searchTerm) {
      const cached = getFromCache<any>(cacheKey)
      if (cached) {
        setCelebrities(cached.data)
        setLastDoc(cached.lastName)
        setLoading(false)
        setHasMore(true)
      }
    }

    setLoading(true)
    try {
      let celebsQuery;
      const LIMIT = 20

      if (searchTerm) {
        const term = searchTerm
        celebsQuery = query(
          collection(db, "artifacts/default-app-id/celebrities"),
          orderBy("name", "asc"),
          startAt(term),
          endAt(term + "\uf8ff"),
          limit(50)
        )
      } else {
        if (loadMore && lastDoc) {
          celebsQuery = query(
            collection(db, "artifacts/default-app-id/celebrities"),
            orderBy("name", "asc"),
            startAfter(lastDoc),
            limit(LIMIT)
          )
        } else {
          celebsQuery = query(
            collection(db, "artifacts/default-app-id/celebrities"),
            orderBy("name", "asc"),
            limit(LIMIT)
          )
        }
      }

      const snapshot = await getDocs(celebsQuery)

      if (searchTerm) {
        setHasMore(snapshot.docs.length === 50)
      } else {
        setHasMore(snapshot.docs.length === LIMIT)
      }

      const celebsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      if (loadMore && !searchTerm) {
        setCelebrities([...celebrities, ...celebsData])
      } else {
        setCelebrities(celebsData)
        if (!searchTerm && celebsData.length > 0) {
          const lastItem = celebsData[celebsData.length - 1] as any
          saveToCache(cacheKey, {
            data: celebsData,
            lastName: lastItem.name
          })
        }
      }

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      }
    } catch (error) {
      console.error("Error fetching celebrities:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async (celebId: string) => {
    if (!user) {
      alert("Please login to add favourites.")
      return
    }
    if (favLoading.has(celebId)) return

    const isCurrentlyFav = userFavorites.has(celebId)
    const newFavState = !isCurrentlyFav

    const newFavorites = new Set(userFavorites)
    if (newFavState) newFavorites.add(celebId)
    else newFavorites.delete(celebId)
    setUserFavorites(newFavorites)

    // Optimistic Count Update
    setCelebrities(prev => prev.map(c =>
      c.id === celebId ? { ...c, favoritesCount: (c.favoritesCount || 0) + (newFavState ? 1 : -1) } : c
    ))

    setFavLoading(prev => new Set(prev).add(celebId))

    try {
      const userFavRef = doc(db, `artifacts/default-app-id/users/${user.uid}/favoritesCelebrities`, celebId)
      const celebRef = doc(db, "artifacts/default-app-id/celebrities", celebId)

      await setDoc(userFavRef, {
        celebrityId: celebId,
        isFavorite: newFavState,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      await updateDoc(celebRef, {
        favoritesCount: increment(newFavState ? 1 : -1)
      })

    } catch (error) {
      console.error("Error toggling favorite:", error)
      setUserFavorites(userFavorites) // Revert state
      setCelebrities(prev => prev.map(c =>
        c.id === celebId ? { ...c, favoritesCount: (c.favoritesCount || 0) - (newFavState ? 1 : -1) } : c
      ))
      alert("Failed to update favorite.")
    } finally {
      setFavLoading(prev => {
        const next = new Set(prev)
        next.delete(celebId)
        return next
      })
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <Header />

      {/* Page Header */}
      {/* Search Header */}
      <div className="container mx-auto px-4 pt-8 pb-4 max-w-7xl relative z-50 mt-4 md:mt-8 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-8">Celebrity Profiles</h1>
        <div className="max-w-xl mx-auto">
          <CelebritySearch onSearch={setSearchTerm} />
        </div>
      </div>

      <main className="container mx-auto px-4 pb-24 max-w-7xl relative z-20">
        {/* Unified Grid Layout for Mobile & Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8 mt-6">
          {loading && celebrities.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-xl" />
            ))
            : celebrities.map((celebrity) => (
              <FadeIn key={celebrity.id}>
                <div className="h-full aspect-[3/4]">
                  <CelebrityCard
                    {...celebrity}
                    isFavorite={userFavorites.has(celebrity.id)}
                    onToggleFavorite={handleToggleFavorite}
                    favoritesCount={celebrity.favoritesCount || 0}
                  />
                </div>
              </FadeIn>
            ))
          }
        </div>

        {!loading && celebrities.length === 0 && (
          <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 mt-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No celebrities found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}

        {!loading && hasMore && celebrities.length > 0 && (
          <div className="flex justify-center mt-16">
            <Button
              size="lg"
              variant="outline"
              onClick={() => fetchCelebrities(true)}
              disabled={loading}
              className="rounded-full px-8 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
