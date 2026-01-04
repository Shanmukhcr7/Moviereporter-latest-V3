"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore"
import { Loader2, Calendar, Trophy } from "lucide-react"

export function UserVotesList() {
    const { user } = useAuth()
    const [votes, setVotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadVotes = async () => {
            if (!user) return
            try {
                // users/{uid}/userVotes
                const q = query(collection(db, "artifacts/default-app-id/users", user.uid, "userVotes"), orderBy("votedAt", "desc"))
                const snapshot = await getDocs(q)

                const detailedVotes = await Promise.all(snapshot.docs.map(async (d) => {
                    const data = d.data()
                    // Fetch Details
                    let categoryName = "Unknown"
                    let nomineeName = "Unknown"
                    let nomineePhoto = "/placeholder.png"

                    try {
                        const catDoc = await getDoc(doc(db, "artifacts/default-app-id/categories", data.categoryId))
                        if (catDoc.exists()) categoryName = catDoc.data().name

                        if (data.isOther) {
                            nomineeName = data.customName || "Other"
                        } else {
                            const nomDoc = await getDoc(doc(db, "artifacts/default-app-id/nominees", data.nomineeId))
                            if (nomDoc.exists()) {
                                nomineeName = nomDoc.data().name
                                nomineePhoto = nomDoc.data().photoUrl || nomineePhoto
                            }
                        }
                    } catch (e) { console.error(e) }

                    return {
                        id: d.id,
                        ...data,
                        categoryName,
                        nomineeName,
                        nomineePhoto
                    }
                }))
                setVotes(detailedVotes)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        loadVotes()
    }, [user])

    if (loading) return <Loader2 className="animate-spin" />
    if (votes.length === 0) return <p className="text-muted-foreground">No votes cast yet.</p>

    return (
        <div className="space-y-4">
            {votes.map(vote => (
                <div key={vote.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-muted overflow-hidden shrink-0">
                        <img src={vote.nomineePhoto} alt={vote.nomineeName} className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <p className="font-semibold">Voted for: <span className="text-primary">{vote.nomineeName}</span></p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Category: {vote.categoryName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(vote.votedAt?.toDate ? vote.votedAt.toDate() : vote.votedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
