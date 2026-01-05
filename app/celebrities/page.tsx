"use client"

import { useEffect, useState } from "react"
import { collection, query, limit, getDocs, startAfter, orderBy, doc, getDoc, setDoc, updateDoc, increment, deleteDoc, startAt, endAt } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Users } from "lucide-react"
import { Header } from "@/components/header"
import { CelebritySearch } from "@/components/celebrity-search"
import { CelebrityCard } from "@/components/celebrity-card"
import { CelebrityListCard } from "@/components/celebrity-list-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
// Removed manual Input/Search/Button imports as they are in CelebritySearch
// Assuming we have sonner or some toast, usually in ui/sonner or similar. If not I'll just use console for now or check utils. 
// The user legacy code used 'showToast' from utils. I might not have that. I'll use simple alert or check if there is a toast component.
// I'll stick to standard console/alert if I don't see a Toast provider usage.
// Actually, I'll check imports later. For now, I'll ommit toast or use a simple one if I can find it.
// The task.md doesn't mention a specific toast library.

export default function CelebritiesPage() {
  const [celebrities, setCelebrities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [lastDoc, setLastDoc] = useState<any>(null)

  // Favorites state
  const { user } = useAuth()
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
  const [favLoading, setFavLoading] = useState<Set<string>>(new Set())

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCelebrities()
    }, 500) // Debounce search fetch against DB
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (user) {
      fetchUserFavorites()
    } else {
      setUserFavorites(new Set())
    }
  }, [user])

  const fetchUserFavorites = async () => {
    if (!user) return
    try {
      const favsRef = collection(db, `artifacts/default-app-id/users/${user.uid}/favoritesCelebrities`)
      const snapshot = await getDocs(favsRef)
      const favIds = new Set<string>()
      snapshot.forEach(doc => {
        if (doc.data().isFavorite) {
          favIds.add(doc.id)
        }
      })
      setUserFavorites(favIds)
    } catch (error) {
      console.error("Error fetching favorites:", error)
    }
  }

  const [hasMore, setHasMore] = useState(true)

  // ... (useEffect and other code) ...

  const fetchCelebrities = async (loadMore = false) => {
    // Cache Check
    const cacheKey = "celebrities_initial_list"
    if (!loadMore && !searchTerm) {
      // Only checking cache for initial load without search
      const cached = getFromCache<any>(cacheKey)
      if (cached) {
        setCelebrities(cached.data)
        setLastDoc(cached.lastName) // Use name as cursor
        setLoading(false)
        setHasMore(true) // Start optimistically
        // SWR: Do NOT return here. Continue to fetch fresh data.
      }
    }

    setLoading(true)
    try {
      let celebsQuery;
      const LIMIT = 16

      if (searchTerm) {
        // Search Mode
        const term = searchTerm
        celebsQuery = query(
          collection(db, "artifacts/default-app-id/celebrities"),
          orderBy("name", "asc"),
          startAt(term),
          endAt(term + "\uf8ff"),
          limit(50)
        )
      } else {
        // Default Pagination Mode
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

      // Update hasMore based on result count
      if (searchTerm) {
        // In search mode, we fetched up to 50. If 50 returned, maybe more? 
        // But logic currently doesn't paginate search.
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

        // Save to cache (Initial list only)
        if (!searchTerm && celebsData.length > 0) {
          const lastItem = celebsData[celebsData.length - 1] as any
          saveToCache(cacheKey, {
            data: celebsData,
            lastName: lastItem.name // Cursor for next page
          })
        }
      }

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      }
    } catch (error) {
      console.error("[v0] Error fetching celebrities:", error)
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

    // Optimistic update
    const isCurrentlyFav = userFavorites.has(celebId)
    const newFavState = !isCurrentlyFav

    // Update local set
    const newFavorites = new Set(userFavorites)
    if (newFavState) {
      newFavorites.add(celebId)
    } else {
      newFavorites.delete(celebId)
    }
    setUserFavorites(newFavorites)

    // Update local count
    setCelebrities(prev => prev.map(c => {
      if (c.id === celebId) {
        return {
          ...c,
          favoritesCount: (c.favoritesCount || 0) + (newFavState ? 1 : -1)
        }
      }
      return c
    }))

    // Add to loading set
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
      // Revert optimistic update
      setUserFavorites(userFavorites) // Set back to old state
      setCelebrities(prev => prev.map(c => {
        if (c.id === celebId) {
          return {
            ...c,
            favoritesCount: (c.favoritesCount || 0) - (newFavState ? 1 : -1)
          }
        }
        return c
      }))
      alert("Failed to update favorite. Please try again.")
    } finally {
      setFavLoading(prev => {
        const next = new Set(prev)
        next.delete(celebId)
        return next
      })
    }
  }

  const displayList = celebrities

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-8 pb-32 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Celebrity Profiles
        </h1>

        <div className="max-w-2xl mx-auto mb-8">
          <CelebritySearch
            onSearch={setSearchTerm}
          />
        </div>

        {/* Desktop View - Grid */}
        <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading && celebrities.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
            ))
            : displayList.map((celebrity) => (
              <CelebrityCard
                key={celebrity.id}
                {...celebrity}
                isFavorite={userFavorites.has(celebrity.id)}
                onToggleFavorite={handleToggleFavorite}
                favoritesCount={celebrity.favoritesCount || 0}
              />
            ))
          }
        </div>

        {/* Mobile View - List */}
        <div className="md:hidden space-y-4">
          {loading && celebrities.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
            ))
            : displayList.map((celebrity) => (
              <CelebrityListCard
                key={celebrity.id}
                {...celebrity}
                isFavorite={userFavorites.has(celebrity.id)}
                favoritesCount={celebrity.favoritesCount || 0}
                onToggleFavorite={handleToggleFavorite}
                disabled={favLoading.has(celebrity.id)}
              />
            ))
          }
        </div>

        {!loading && displayList.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No celebrities found</p>
          </div>
        )}

        {!loading && hasMore && displayList.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={() => fetchCelebrities(true)} disabled={loading}>
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
