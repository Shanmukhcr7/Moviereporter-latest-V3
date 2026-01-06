"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Poll, PollCard } from "@/components/poll-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const { user, userData } = useAuth()

  useEffect(() => {
    fetchPolls()
  }, [])

  const fetchPolls = async () => {
    // Cache Check
    const cacheKey = "polls_page_all_v2"
    const cached = getFromCache<Poll[]>(cacheKey)
    if (cached) {
      setPolls(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    try {
      const q = query(
        collection(db, "artifacts/default-app-id/polls"),
        orderBy("createdAt", "desc"),
        limit(50)
      )
      const snap = await getDocs(q)
      const pollsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll))

      setPolls(pollsData)
      saveToCache(cacheKey, pollsData)
    } catch (error) {
      console.error("Error fetching polls:", error)
      toast.error("Failed to load polls")
    } finally {
      setLoading(false)
    }
  }

  const livePolls = polls.filter(poll => {
    if (!poll.endTime) return true
    // distinct handling for timestamp
    let end = 0
    if (poll.endTime.seconds) {
      end = poll.endTime.seconds * 1000
    } else if (typeof poll.endTime.toMillis === 'function') {
      end = poll.endTime.toMillis()
    } else {
      const d = new Date(poll.endTime)
      if (!isNaN(d.getTime())) end = d.getTime()
    }
    return end === 0 || end > Date.now()
  })

  const completedPolls = polls.filter(poll => {
    if (!poll.endTime) return false
    // distinct handling for timestamp
    let end = 0
    if (poll.endTime.seconds) {
      end = poll.endTime.seconds * 1000
    } else if (typeof poll.endTime.toMillis === 'function') {
      end = poll.endTime.toMillis()
    } else {
      const d = new Date(poll.endTime)
      if (!isNaN(d.getTime())) end = d.getTime()
    }
    return end > 0 && end <= Date.now()
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Polls</h1>
          <p className="text-muted-foreground">Voice your opinion on the latest trending topics!</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : (
          <Tabs defaultValue="live" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="live" className="mt-0">
              {livePolls.length === 0 ? (
                <div className="text-center py-16 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No active polls right now. Check back later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                  {livePolls.map(poll => (
                    <div key={poll.id} className="w-full h-full">
                      <PollCard poll={poll} user={user} currentUserData={userData} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              {completedPolls.length === 0 ? (
                <div className="text-center py-16 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No completed polls yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                  {completedPolls.map(poll => (
                    <div key={poll.id} className="w-full h-full opacity-90">
                      <PollCard poll={poll} user={user} currentUserData={userData} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
