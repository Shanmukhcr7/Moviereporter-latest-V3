"use client"

import { useEffect, useState, useMemo } from "react"
import { collection, query, getDocs, doc, getDoc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Winner {
  id: string
  year: string | number
  industry: string
  celebrityName?: string
  celebrityPhoto?: string
  celebrityId?: string // This might be a nominee ID
  category?: string
  categoryName?: string
  [key: string]: any
}

interface ResolvedWinner extends Winner {
  finalName: string
  finalPhoto: string
  realCelebrityId: string | null
}

const INDUSTRIES = ["Tollywood", "Bollywood", "Kollywood", "Mollywood", "Sandalwood"]

import { useAwardYears } from "@/hooks/use-award-years"

export default function AwardWinnersPage() {
  const [allWinners, setAllWinners] = useState<Winner[]>([])
  // use shared hook for years
  const { years: availableYears, loading: loadingYears } = useAwardYears()
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedIndustry, setSelectedIndustry] = useState<string>("Tollywood")
  const [displayedWinners, setDisplayedWinners] = useState<ResolvedWinner[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingWinners, setLoadingWinners] = useState(false)

  // Cache to prevent re-fetching same celebrity details
  const celebCache = useMemo(() => new Map<string, any>(), [])
  const nomineeCache = useMemo(() => new Map<string, any>(), [])

  useEffect(() => {
    // Set default year once years are loaded
    if (availableYears.length > 0 && !selectedYear) {
      // Check URL param?
      const params = new URLSearchParams(window.location.search)
      const urlYear = params.get('year')
      if (urlYear && availableYears.includes(urlYear)) {
        setSelectedYear(urlYear)
      } else {
        setSelectedYear(availableYears[0])
      }
    }
  }, [availableYears, selectedYear])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all winners 
        // We still need all winners for filtering. 
        // Future optimization: fetch only for selected year/industry.
        // But for now, to keep logic similar to legacy, we fetch relevant ones.
        // Actually, let's optimize: only fetch if we don't have them?
        // The legacy code fetched all. Let's stick to fetching all for now for client-side filtering ease
        // OR better: fetch based on query if we want to be scalable.
        // Given the prompt "automatically populated", fetching all metadata is fine.

        const q = query(collection(db, "artifacts/default-app-id/winners"), orderBy('year', 'desc'))
        const snap = await getDocs(q)

        const winnersList: Winner[] = []
        snap.forEach(docSnap => {
          winnersList.push({ id: docSnap.id, ...docSnap.data() } as Winner)
        })
        setAllWinners(winnersList)
      } catch (error) {
        console.error("Error fetching winners:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    const resolveWinners = async () => {
      if (!selectedYear || !selectedIndustry) return

      setLoadingWinners(true)

      // Filter first
      const filtered = allWinners.filter(w =>
        String(w.year) === selectedYear &&
        w.industry?.toLowerCase() === selectedIndustry.toLowerCase()
      )

      // Resolve details
      const resolved = await Promise.all(filtered.map(async (w) => {
        let finalName = w.celebrityName || "Unknown"
        let finalPhoto = w.celebrityPhoto || ""
        let realCelebrityId
        // Logic: Winner -> Nominee (via w.celebrityId) -> Celebrity
        if (w.celebrityId) {
          try {
            let nomineeData = nomineeCache.get(w.celebrityId)
            if (!nomineeData) {
              // Try 'award-nominees' first (matches current rules)
              let collectionName = "award-nominees"
              let nomineeSnap = await getDoc(doc(db, `artifacts/default-app-id/${collectionName}`, w.celebrityId))

              // Fallback to 'nominees' if not found (legacy compatibility)
              if (!nomineeSnap.exists()) {
                collectionName = "nominees"
                nomineeSnap = await getDoc(doc(db, `artifacts/default-app-id/${collectionName}`, w.celebrityId))
              }

              if (nomineeSnap.exists()) {
                nomineeData = nomineeSnap.data()
                nomineeCache.set(w.celebrityId, nomineeData)
                console.log(`[Resolution] Found nominee in ${collectionName}:`, nomineeData)
              } else {
                // Fallback: Maybe w.celebrityId IS the real celebrity ID already?
                console.log(`[Resolution] Nominee not found for ID ${w.celebrityId}, checking direct celebrity...`)
                const directCelebSnap = await getDoc(doc(db, "artifacts/default-app-id/celebrities", w.celebrityId))
                if (directCelebSnap.exists()) {
                  // Pretend it was a nominee doc pointing to itself
                  nomineeData = { celebrityId: w.celebrityId }
                  nomineeCache.set(w.celebrityId, nomineeData)
                }
              }
            }

            if (nomineeData?.celebrityId) {
              realCelebrityId = nomineeData.celebrityId

              // Fetch Celeb
              let celebData = celebCache.get(realCelebrityId!)
              if (!celebData) {
                const celebSnap = await getDoc(doc(db, "artifacts/default-app-id/celebrities", realCelebrityId!))
                if (celebSnap.exists()) {
                  celebData = celebSnap.data()
                  celebCache.set(realCelebrityId!, celebData)
                }
              }

              if (celebData) {
                finalName = celebData.name || finalName
                finalPhoto = celebData.image || celebData.imageUrl || celebData.profileImage || finalPhoto
              }
            } else {
              console.log(`[Resolution] No celebrityId found in nominee data for ${w.celebrityId}`)
            }
          } catch (e) {
            console.error("Error resolving winner details:", e)
          }
        }

        return {
          ...w,
          finalName,
          finalPhoto,
          realCelebrityId
        }
      }))

      setDisplayedWinners(resolved)
      setLoadingWinners(false)
    }

    if (allWinners.length > 0) {
      resolveWinners()
    }
  }, [selectedYear, selectedIndustry, allWinners, celebCache, nomineeCache])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Trophy className="text-yellow-500 w-8 h-8" />
              Award Winners
            </h1>
            <p className="text-muted-foreground">Celebrating excellence in cinema across the years.</p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {loadingWinners ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : displayedWinners.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Winners Found</h3>
                <p className="text-muted-foreground">
                  No records found for {selectedIndustry} in {selectedYear}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedWinners.map((w) => (
                  <div key={w.id} className="group relative">
                    <Card className="overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-yellow-500 h-full">
                      {/* Make the entire card clickable if link exists */}
                      {w.realCelebrityId ? (
                        <Link href={`/celebrity/${w.realCelebrityId}`} className="block h-full">
                          <CardContent className="p-4 flex items-center gap-4 h-full">
                            <Avatar className="w-16 h-16 border-2 border-yellow-500/20 shrink-0">
                              <AvatarImage src={w.finalPhoto} className="object-cover" />
                              <AvatarFallback>{w.finalName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                              <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                                {w.finalName}
                              </h3>
                              <p className="text-sm text-yellow-600/90 font-medium truncate">
                                {w.categoryName || w.category || "Winner"}
                              </p>
                            </div>
                          </CardContent>
                        </Link>
                      ) : (
                        <CardContent className="p-4 flex items-center gap-4 h-full">
                          <Avatar className="w-16 h-16 border-2 border-yellow-500/20 shrink-0">
                            <AvatarImage src={w.finalPhoto} className="object-cover" />
                            <AvatarFallback>{w.finalName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="font-bold text-lg truncate text-muted-foreground">
                              {w.finalName}
                            </h3>
                            <p className="text-sm text-yellow-600/90 font-medium truncate">
                              {w.categoryName || w.category || "Winner"}
                            </p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
