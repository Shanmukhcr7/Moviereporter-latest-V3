"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs, Timestamp, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { useAuth } from "@/lib/auth-context"
import { SectionCarousel } from "@/components/ui/section-carousel"
import { Loader2 } from "lucide-react"
import { Poll, PollCard, PollOption } from "@/components/poll-card"

export function HomePolls() {
    const { user, userData } = useAuth()
    const [polls, setPolls] = useState<Poll[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPolls = async () => {
        try {
            const cacheKey = "home_polls_latest"
            const cached = getFromCache<Poll[]>(cacheKey)
            if (cached) {
                setPolls(cached)
                setLoading(false)
                // SWR: Continue fetch
            }

            const now = Timestamp.now()
            // Fetch by createdAt to ensure visibility of new items
            // We can filter active client side if needed, or assume newly created are relevant
            const q = query(
                collection(db, "artifacts/default-app-id/polls"),
                orderBy("createdAt", "desc"),
                limit(10)
            )
            const snap = await getDocs(q)

            const loadedPolls: Poll[] = []

            for (const docSnap of snap.docs) {
                const data = docSnap.data()
                // Normalize options
                let options: PollOption[] = []
                if (Array.isArray(data.options)) {
                    options = data.options.map((o: any, idx: number) => {
                        if (typeof o === 'string') return { id: String(idx), text: o }
                        return { id: String(o.id ?? idx), text: o.text || `Option ${idx + 1}`, isOther: !!o.isOther, imageUrl: o.imageUrl }
                    })
                } else if (data.options && typeof data.options === 'object') {
                    options = Object.entries(data.options).map(([k, v]: [string, any], idx) => {
                        if (typeof v === 'string') return { id: k, text: v }
                        return { id: k, text: v.text || `Option ${idx + 1}`, isOther: !!v.isOther, imageUrl: v.imageUrl }
                    })
                }

                const poll: Poll = {
                    id: docSnap.id,
                    question: data.question || "Untitled Poll",
                    options,
                    startTime: data.startTime,
                    endTime: data.endTime,
                }
                loadedPolls.push(poll)
            }
            setPolls(loadedPolls.filter(poll => {
                // Client-side filter: Hide if endTime is in the past
                if (poll.endTime) {
                    // Check if Timestamp or similar object
                    let endMillis = 0
                    if (typeof poll.endTime.toMillis === 'function') {
                        endMillis = poll.endTime.toMillis()
                    } else if (poll.endTime.seconds) {
                        endMillis = poll.endTime.seconds * 1000
                    }
                    if (endMillis > 0 && endMillis < Date.now()) return false
                }
                return true
            }))
            saveToCache("home_polls_latest", loadedPolls)
        } catch (error) {
            console.error("Error loading polls:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPolls()
    }, [])

    if (loading) return <div className="py-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
    if (polls.length === 0) return null

    return (
        <section className="py-4">
            <h2 className="text-3xl font-bold mb-6">Latest Polls</h2>
            <SectionCarousel className="gap-6 pb-4">
                {polls.map(poll => (
                    <div key={poll.id} className="min-w-[300px] md:min-w-[400px] snap-start h-full">
                        {/* Pass userData to ensure consistent name resolution */}
                        <PollCard poll={poll} user={user} currentUserData={userData} />
                    </div>
                ))}
            </SectionCarousel>
        </section>
    )
}
