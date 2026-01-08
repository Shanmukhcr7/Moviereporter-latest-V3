"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Award, Clock, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { VotingCard } from "@/components/voting-card"
import { toast } from "sonner" // Ensure we use toast for feedbacks
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button" // Assuming Button is available
import { SectionCarousel } from "@/components/ui/section-carousel"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

interface Nominee {
  id: string
  categoryId: string
  celebrityId?: string
  movieId?: string
  isOther?: boolean
  votes?: number
  celebrity?: any
  movie?: any
  [key: string]: any
}

interface Category {
  id: string
  name: string
  industry: string
  startDate: any
  endDate: any
  nominees: Nominee[]
  [key: string]: any
}

interface OtherChoice {
  id: string
  categoryId: string
  nomineeId: string
  text: string
  userId: string
  createdAt?: any // Timestamp
}

export default function VoteEnrollPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Helper to normalize URL param to State value
  const getInitialIndustry = () => {
    const param = searchParams.get("industry")
    if (!param) return "Tollywood"

    // Convert "pan-india" -> "Pan India", "tollywood" -> "Tollywood"
    // Simple mapping or title case conversion
    if (param === "pan-india") return "Pan India"

    // Capitalize first letter
    return param.charAt(0).toUpperCase() + param.slice(1)
  }

  const [categories, setCategories] = useState<Category[]>([])
  const [industryFilter, setIndustryFilter] = useState(getInitialIndustry())
  const [userVotes, setUserVotes] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [votingLoading, setVotingLoading] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  // Update URL when filter changes
  const handleIndustryChange = (value: string) => {
    setIndustryFilter(value)
    const param = value.toLowerCase().replace(" ", "-")
    const params = new URLSearchParams(searchParams)
    params.set("industry", param)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Sync state if URL changes externally (e.g. back button)
  useEffect(() => {
    const current = getInitialIndustry()
    if (current !== industryFilter) {
      setIndustryFilter(current)
    }
  }, [searchParams])

  // Other Option State
  const [otherDialogOpen, setOtherDialogOpen] = useState(false)
  const [choicesDialogOpen, setChoicesDialogOpen] = useState(false)
  const [customVoteText, setCustomVoteText] = useState("")
  const [activeOtherNominee, setActiveOtherNominee] = useState<{ id: string, categoryId: string } | null>(null)
  const [otherChoices, setOtherChoices] = useState<OtherChoice[]>([])
  const [choicesLoading, setChoicesLoading] = useState(false)

  // Confirmation State
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingVote, setPendingVote] = useState<{ categoryId: string, nomineeId: string } | null>(null)

  const confirmVote = (categoryId: string, nomineeId: string) => {
    setPendingVote({ categoryId, nomineeId })
    setConfirmDialogOpen(true)
  }

  const executeVote = () => {
    if (pendingVote) {
      handleVote(pendingVote.categoryId, pendingVote.nomineeId)
      setPendingVote(null)
      setConfirmDialogOpen(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [industryFilter, user])

  // Fetch Categories
  const fetchCategories = async () => {
    // SWR Cache Check
    const cacheKey = `vote_categories_v3_${industryFilter}`
    if (loading) { // Only check cache on initial load or filter change
      const cached = getFromCache<Category[]>(cacheKey)
      if (cached) {
        setCategories(cached)
        setLoading(false)
        // Continue fetching in background
      }
    }

    try {
      // Normalize industry for DB Query (DB uses lowercase, hyphenated)
      // e.g. "Tollywood" -> "tollywood", "Pan India" -> "pan-india"
      const dbIndustry = industryFilter.toLowerCase().replace(" ", "-")

      const categoriesQuery = query(
        collection(db, "artifacts/default-app-id/categories"),
        where("industry", "==", dbIndustry)
      )

      const snapshot = await getDocs(categoriesQuery)

      // Fetch nominees in parallel
      const categoriesData = await Promise.all(
        snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Category))
          // Removed strict date filter to ensure visibility. 
          // We can visually indicate status (Active/Ended) instead of hiding.
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .map(async (categoryData) => {
            const nomineesQuery = query(
              collection(db, "artifacts/default-app-id/nominees"),
              where("categoryId", "==", categoryData.id),
            )
            const nomineesSnapshot = await getDocs(nomineesQuery)

            const nominees = await Promise.all(
              nomineesSnapshot.docs.map(async (nomineeDoc) => {
                const nomineeData = nomineeDoc.data()
                let celebData = {}
                let movieData = {}

                if (nomineeData.celebId || nomineeData.celebrityId) {
                  const cId = nomineeData.celebId || nomineeData.celebrityId
                  const celebDoc = await getDoc(doc(db, "artifacts/default-app-id/celebrities", cId))
                  if (celebDoc.exists()) celebData = celebDoc.data()
                }

                if (nomineeData.movieId) {
                  const movieDoc = await getDoc(doc(db, "artifacts/default-app-id/movies", nomineeData.movieId))
                  if (movieDoc.exists()) movieData = movieDoc.data()
                }

                return {
                  id: nomineeDoc.id,
                  ...nomineeData,
                  celebrity: celebData,
                  movie: movieData,
                } as Nominee
              }),
            )

            // Sort: Put 'Other' option at the end
            nominees.sort((a, b) => {
              const aOther = a.isOther ? 1 : 0;
              const bOther = b.isOther ? 1 : 0;
              return aOther - bOther;
            })

            return { ...categoryData, nominees }
          }),
      )

      setCategories(categoriesData)
      saveToCache(cacheKey, categoriesData)

      if (user) {
        // Legacy path: subcollection under user
        const userVotesRef = collection(db, "artifacts/default-app-id/users", user.uid, "userVotes")
        const votesSnapshot = await getDocs(userVotesRef)
        const votes: Record<string, any> = {}
        votesSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          votes[doc.id] = {
            ...data,
            voteId: doc.id
          }
        })
        setUserVotes(votes)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (categoryId: string, nomineeId: string, customText: string | null = null, isOther: boolean = false) => {
    if (!user) {
      toast.error("Please login to vote!")
      return
    }

    const existingVote = userVotes[categoryId]
    const now = new Date().toISOString()

    // Check local duplicate vote attempt
    if (existingVote && existingVote.nomineeId === nomineeId && !isOther) {
      toast.info("You already voted for this choice.")
      return
    }

    // Cooldown Logic
    if (existingVote) {
      // Helper to safely parse date/timestamp
      const getDate = (val: any) => {
        if (!val) return new Date();
        if (val.toDate) return val.toDate(); // Firestore Timestamp
        if (val.seconds) return new Date(val.seconds * 1000); // Serialized Timestamp
        return new Date(val); // String or Date
      }

      const votedAt = getDate(existingVote.votedAt)
      const oneDayAgo = new Date()
      oneDayAgo.setHours(oneDayAgo.getHours() - 24)

      if (votedAt > oneDayAgo) {
        toast.error("You can only change your vote after 24 hours.")
        return
      }
    }

    if (isOther && !customText?.trim()) {
      toast.error("Please enter your choice.")
      return
    }

    setVotingLoading(nomineeId)

    try {
      // Optimistic Update
      const newVoteData = {
        nomineeId,
        userId: user.uid,
        categoryId,
        votedAt: now,
        isOther,
        customName: customText || null
      }

      setUserVotes(prev => ({ ...prev, [categoryId]: newVoteData }))

      // Update count locally for NON-Other
      if (!isOther) {
        setCategories(prevCats => prevCats.map(cat => {
          if (cat.id !== categoryId) return cat;
          return {
            ...cat,
            nominees: cat.nominees.map((n: any) => {
              let newVotes = n.votes || 0;
              if (n.id === nomineeId) newVotes++;
              if (existingVote && n.id === existingVote.nomineeId && !existingVote.isOther) newVotes--;
              return { ...n, votes: newVotes }
            })
          }
        }))
      }

      // Firestore Updates
      const userVoteRef = doc(db, "artifacts/default-app-id/users", user.uid, "userVotes", categoryId)

      if (isOther) {
        // 1. Set user vote
        const voteData = {
          nomineeId,
          userId: user.uid,
          categoryId,
          votedAt: new Date(),
          customName: customText,
          isOther: true
        }
        const { setDoc } = await import("firebase/firestore")
        await setDoc(userVoteRef, voteData)

        // Increment Category Total if new
        if (!existingVote) {
          const categoryRef = doc(db, "artifacts/default-app-id/categories", categoryId)
          await updateDoc(categoryRef, { totalVotes: increment(1) })
        }

        // 2. Add to otherChoices
        await addDoc(collection(db, "artifacts/default-app-id/otherChoices"), {
          categoryId,
          nomineeId,
          text: customText,
          userId: user.uid,
          createdAt: new Date()
        })
        toast.success("Choice submitted successfully!")

      } else {
        // Standard Vote
        const { runTransaction } = await import("firebase/firestore")
        const nomineeRef = doc(db, "artifacts/default-app-id/nominees", nomineeId)

        await runTransaction(db, async (transaction) => {
          // 1. Decrement old nominee if exists
          if (existingVote && !existingVote.isOther) {
            const oldNomineeRef = doc(db, "artifacts/default-app-id/nominees", existingVote.nomineeId)
            transaction.update(oldNomineeRef, { votes: increment(-1) })
          }

          // 2. Increment new nominee
          transaction.update(nomineeRef, { votes: increment(1) })

          // 3. Set vote doc
          transaction.set(userVoteRef, {
            nomineeId,
            userId: user.uid,
            categoryId,
            votedAt: new Date(),
            isOther: false
          })

          // 4. Increment Category Total (Only if new vote)
          if (!existingVote) {
            const categoryRef = doc(db, "artifacts/default-app-id/categories", categoryId)
            transaction.update(categoryRef, { totalVotes: increment(1) })
          }
        })
        toast.success("Vote submitted!")
      }

    } catch (error: any) {
      console.error("Error voting:", error)
      toast.error(error.message || "Failed to submit vote.")
      fetchCategories() // Revert/Sync
    } finally {
      setVotingLoading(null)
      setOtherDialogOpen(false)
      setCustomVoteText("")
    }
  }

  const openCustomVoteDialog = (categoryId: string, nomineeId: string) => {
    setActiveOtherNominee({ id: nomineeId, categoryId })
    setCustomVoteText("")
    setOtherDialogOpen(true)
  }

  const openChoicesDialog = async (categoryId: string, nomineeId: string) => {
    setActiveOtherNominee({ id: nomineeId, categoryId })
    setChoicesDialogOpen(true)
    setChoicesLoading(true)

    try {
      const q = query(
        collection(db, "artifacts/default-app-id/otherChoices"),
        where("categoryId", "==", categoryId),
        where("nomineeId", "==", nomineeId)
      )

      const snapshot = await getDocs(q)
      let choices = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OtherChoice))

      // Simple client-side sort for now
      choices.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))

      setOtherChoices(choices)
    } catch (e) {
      console.error("Error fetching choices", e)
      toast.error("Failed to load choices")
    } finally {
      setChoicesLoading(false)
    }
  }

  const handleShare = (nominee: any) => {
    if (navigator.share) {
      navigator.share({
        title: `Vote for ${nominee.celebrity?.name || 'My Choice'}`,
        text: `Vote for ${nominee.celebrity?.name || 'Nominee'} in the Movie Lovers Awards!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.info("Link copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-4 pb-32">
        <div className="sticky top-20 z-30 bg-background/95 backdrop-blur py-2 mb-4 -mx-4 px-4 border-b border-border/40">
          <div className="flex justify-center">
            <Select value={industryFilter} onValueChange={handleIndustryChange}>
              <SelectTrigger className="w-full sm:w-[280px] bg-card shadow-sm">
                <SelectValue placeholder="Select Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tollywood">Tollywood</SelectItem>
                <SelectItem value="Bollywood">Bollywood</SelectItem>
                <SelectItem value="Kollywood">Kollywood</SelectItem>
                <SelectItem value="Sandalwood">Sandalwood</SelectItem>
                <SelectItem value="Hollywood">Hollywood</SelectItem>
                <SelectItem value="Mollywood">Mollywood</SelectItem>
                <SelectItem value="Pan India">Pan India</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed">
            <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Active Voting</h3>
            <p className="text-muted-foreground">There are currently no active categories for {industryFilter}.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const userVote = userVotes[category.id]

              // Helper for current cat logic
              const isExpanded = expandedCategories[category.id] !== undefined ? expandedCategories[category.id] : !userVote

              return (
                <div key={category.id} className="scroll-mt-24 awards-category-block" id={category.id}>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b pb-2">
                    <div>
                      <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        {category.name}
                      </h2>
                      <p className="text-muted-foreground mt-1">Select your favorite</p>
                    </div>
                    {/* Status Badges */}
                    <div className="flex gap-3">
                      {userVote && (
                        <Badge className="bg-green-600 hover:bg-green-600 h-8 px-3">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          {userVote.customName ? `Voted: ${userVote.customName}` : "Voted"}
                        </Badge>
                      )}
                      <CountdownTimer targetDate={category.endDate} />
                    </div>
                  </div>

                  {userVote && (
                    <VoteSummary
                      category={category}
                      userVote={userVote}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleCategoryExpand(category.id)}
                    />
                  )}

                  {isExpanded && (
                    <SectionCarousel className="md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:pb-0 md:mx-0 md:px-0 scrollbar-hide">
                      {category.nominees?.map((nominee: any) => {
                        const isVoted = userVote?.nomineeId === nominee.id
                        // Strict Lock: If any vote exists in this category, disable interactions for all
                        const isCategoryLocked = !!userVote

                        return (
                          <div key={nominee.id} className="min-w-[160px] w-[160px] md:w-auto md:min-w-0 snap-center">
                            <VotingCard
                              nominee={nominee}
                              isVoted={isVoted}
                              canChange={false} // Strict lock requested: no changing allowed
                              onVote={(id) => confirmVote(category.id, id)}
                              onShare={handleShare}
                              onCustomVote={(id) => openCustomVoteDialog(category.id, id)}
                              onViewChoices={(id) => openChoicesDialog(category.id, id)}
                              disabled={isCategoryLocked || votingLoading === nominee.id}
                            />
                          </div>
                        )
                      })}
                    </SectionCarousel>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Vote</DialogTitle>
            <DialogDescription>
              Are you sure you want to vote for this nominee?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeVote}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Vote Dialog */}
      <Dialog open={otherDialogOpen} onOpenChange={setOtherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give Your Choice</DialogTitle>
            <DialogDescription>
              Who do you think this award belongs to?
            </DialogDescription>
          </DialogHeader>
          <Input
            value={customVoteText}
            onChange={(e) => setCustomVoteText(e.target.value)}
            placeholder="Enter nominee name..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOtherDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => activeOtherNominee && handleVote(activeOtherNominee.categoryId, activeOtherNominee.id, customVoteText, true)}>
              Submit Choice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Choices Dialog */}
      <Dialog open={choicesDialogOpen} onOpenChange={setChoicesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Other Users' Choices</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            {choicesLoading ? (
              <div className="flex justify-center p-4">Loading...</div>
            ) : otherChoices.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">No choices submitted yet.</div>
            ) : (
              <div className="space-y-4">
                {otherChoices.map((choice) => (
                  <div key={choice.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{choice.userId?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none mb-1">User {choice.userId?.slice(0, 4)}...</p>
                      <p className="text-sm text-foreground">{choice.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {choice.createdAt?.seconds ? formatDistanceToNow(new Date(choice.createdAt.seconds * 1000), { addSuffix: true }) : "recently"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function VoteSummary({ category, userVote, onToggleExpand, isExpanded }: { category: any, userVote: any, onToggleExpand: () => void, isExpanded: boolean }) {
  const votedNominee = category.nominees.find((n: any) => n.id === userVote.nomineeId)
  const isOther = userVote.isOther

  // Fallback if nominee data missing but we have vote
  const nomineeName = isOther ? (userVote.customName || "Custom Choice") : (votedNominee?.celebrity?.name || "Your Choice")
  const photoUrl = isOther ? "/placeholder.svg" : (votedNominee?.celebrity?.image || votedNominee?.celebrity?.imageUrl || "/placeholder.svg")

  return (
    <div
      onClick={onToggleExpand}
      className="cursor-pointer bg-card hover:bg-accent/50 transition-colors border rounded-lg p-4 flex items-center justify-between mb-6 shadow-sm group category-summary"
    >
      <div className="flex items-center gap-4">
        {/* Left: Image + Meta */}
        <div className="relative h-12 w-12 rounded-full overflow-hidden border border-border">
          <img
            src={photoUrl}
            alt={nomineeName}
            className="object-cover h-full w-full"
          />
        </div>
        <div className="flex flex-col">
          <div className="text-base font-semibold text-foreground">{category.name}</div>
          <div className="text-sm text-muted-foreground">
            You voted for <strong className="text-foreground">{nomineeName}</strong> {isOther && "(Other)"}
          </div>
        </div>
      </div>

      {/* Right: Arrow */}
      <div className="text-muted-foreground group-hover:text-foreground transition-colors text-xl">
        {isExpanded ? "▴" : "▾"}
      </div>
    </div>
  )
}

function CountdownTimer({ targetDate }: { targetDate: any }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null)

  useEffect(() => {
    // Helper to safely parse
    const getDate = (val: any): Date | null => {
      if (!val) return null
      try {
        if (typeof val === 'object' && val.toDate) return val.toDate() // Firestore Timestamp
        if (typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000) // Serialized Timestamp
        return new Date(val) // String or Date
      } catch (e) {
        return null
      }
    }

    const target = getDate(targetDate)
    if (!target) return

    const targetTime = target.getTime()

    // Initial check
    const now = new Date().getTime()
    if (targetTime - now < 0) {
      setTimeLeft(null)
      return
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = targetTime - now

      if (distance < 0) {
        setTimeLeft(null)
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000)
        })
      }
    }

    updateTimer() // Initial call
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (!timeLeft) {
    return (
      <Badge variant="outline" className="h-8 px-3 border-red-500/50 text-red-600 bg-red-500/10 cursor-help" title="Voting has ended for this category">
        Voting Ended
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="h-8 px-3 border-orange-500/50 text-orange-600 dark:text-orange-400 tabular-nums">
      <Clock className="h-3.5 w-3.5 mr-1.5" />
      {timeLeft.d}d {timeLeft.h}h {timeLeft.m}m {timeLeft.s}s
    </Badge>
  )
}
