"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Poll, PollCard } from "@/components/poll-card"

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const { user, userData } = useAuth()

  useEffect(() => {
    fetchActivePolls()
  }, [])

  const fetchActivePolls = async () => {
    setLoading(true)
    try {
      const now = Timestamp.now()
      const q = query(
        collection(db, "artifacts/default-app-id/polls"),
        where("startTime", "<=", now),
        where("endTime", ">=", now),
        orderBy("startTime", "desc")
      )
      const snap = await getDocs(q)
      const pollsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll))
      setPolls(pollsData)
    } catch (error) {
      console.error("Error fetching polls:", error)
      toast.error("Failed to load polls")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Live Polls</h1>
          <p className="text-muted-foreground">Voice your opinion on the latest trending topics!</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No active polls right now. Check back later!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 pb-8">
            {/* Responsive Grid Layout: Vertical stack on mobile, Grid on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
              {polls.map(poll => (
                <div key={poll.id} className="w-full h-full">
                  <PollCard poll={poll} user={user} currentUserData={userData} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
