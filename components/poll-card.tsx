"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Clock, CheckCircle2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

export interface PollOption {
    id?: string
    text: string
    imageUrl?: string
    isOther?: boolean
}

export interface Poll {
    id: string
    question: string
    options: PollOption[]
    startTime: any
    endTime: any
    [key: string]: any
}

interface Vote {
    userId: string
    selectedOption: string
    customText?: string
    updatedAt?: any
}

interface UserVote {
    pollId: string
    selectedOption: string
    customText?: string
    votedAt: any
}

export function PollCard({ poll, user, currentUserData }: { poll: Poll, user: any, currentUserData: any }) {
    const [votes, setVotes] = useState<Vote[]>([])
    const [currentUserVote, setCurrentUserVote] = useState<UserVote | null>(null)
    const [loadingVotes, setLoadingVotes] = useState(true)
    const [selectedOption, setSelectedOption] = useState<string>("")
    const [customText, setCustomText] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Dialog states
    const [customAnswersOpen, setCustomAnswersOpen] = useState(false)
    const [customAnswers, setCustomAnswers] = useState<any[]>([])
    const [loadingCustomAnswers, setLoadingCustomAnswers] = useState(false)

    useEffect(() => {
        fetchVotes()
    }, [poll.id, user])

    const fetchVotes = async () => {
        setLoadingVotes(true)
        try {
            const votesRef = collection(db, `artifacts/default-app-id/polls/${poll.id}/votes`)
            const snap = await getDocs(votesRef)
            const votesData = snap.docs.map(doc => doc.data() as Vote)
            setVotes(votesData)

            if (user) {
                const myVote = votesData.find(v => v.userId === user.uid)
                if (myVote) {
                    setCurrentUserVote({
                        pollId: poll.id,
                        selectedOption: myVote.selectedOption,
                        customText: myVote.customText,
                        votedAt: myVote.updatedAt
                    })
                    setSelectedOption(myVote.selectedOption)
                }
            }
        } catch (error) {
            console.error("Error fetching votes:", error)
        } finally {
            setLoadingVotes(false)
        }
    }

    const handleVoteSubmit = async () => {
        if (!user) {
            toast.error("Please login to vote")
            return
        }
        if (!selectedOption) {
            toast.warning("Please select an option")
            return
        }

        const isOther = poll.options.find(o => (typeof o === 'string' ? o : o.text) === selectedOption)?.isOther
        if (isOther && !customText.trim()) {
            toast.warning("Please type your answer")
            return
        }

        setIsSubmitting(true)
        try {
            const voteDocRef = doc(db, `artifacts/default-app-id/polls/${poll.id}/votes`, user.uid)
            await setDoc(voteDocRef, {
                userId: user.uid,
                selectedOption,
                customText: isOther ? customText : null,
                updatedAt: Timestamp.now()
            }, { merge: true })

            toast.success("Vote recorded!")
            await fetchVotes() // Refresh counts
        } catch (error) {
            console.error("Vote failed:", error)
            toast.error("Failed to submit vote")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChangeVote = () => {
        setCurrentUserVote(null)
        // We don't delete the vote from server yet, only when they submit new one
    }

    const loadCustomAnswers = async () => {
        setCustomAnswersOpen(true)
        setLoadingCustomAnswers(true)
        try {
            const votesRef = collection(db, `artifacts/default-app-id/polls/${poll.id}/votes`)
            const snap = await getDocs(votesRef)
            const customVotes = snap.docs
                .map(d => d.data() as Vote)
                .filter(v => v.selectedOption === 'Other' || v.customText) // Capture any with custom text really

            // Resolve usernames
            const resolved = await Promise.all(customVotes.map(async (v) => {
                let name = "Anonymous"
                if (v.userId) {
                    if (user && v.userId === user.uid) {
                        name = currentUserData?.username || currentUserData?.displayName || user.displayName || "Me"
                    } else {
                        try {
                            const userDoc = await getDoc(doc(db, "artifacts/default-app-id/users", v.userId))
                            if (userDoc.exists()) {
                                const uData = userDoc.data()
                                name = uData.username || uData.name || uData.displayName || "Anonymous"
                            }
                        } catch (e) { console.error(e) }
                    }
                }
                return { ...v, resolvedName: name }
            }))
            setCustomAnswers(resolved)
        } catch (error) {
            toast.error("Failed to load answers")
        } finally {
            setLoadingCustomAnswers(false)
        }
    }

    // Calculate stats
    const totalVotes = votes.length
    const voteCounts: Record<string, number> = {}
    votes.forEach(v => {
        voteCounts[v.selectedOption] = (voteCounts[v.selectedOption] || 0) + 1
    })

    // Has "Other" option?
    const hasOther = poll.options.some(o => o.isOther)

    if (loadingVotes) {
        return <div className="h-[400px] w-full bg-muted animate-pulse rounded-xl" />
    }

    const isVotingMode = !currentUserVote

    return (
        <Card className="h-full flex flex-col w-full shadow-lg border-t-4 border-t-primary">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl leading-tight">{poll.question}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Ends {poll.endTime?.toDate ? formatDistanceToNow(poll.endTime.toDate(), { addSuffix: true }) : 'soon'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 min-h-[350px]">

                {/* Scrollable Options Area */}
                <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3 pr-1">
                    {poll.options.map((opt, idx) => {
                        const text = typeof opt === 'string' ? opt : opt.text
                        const isOther = typeof opt !== 'string' && opt.isOther
                        const imageUrl = typeof opt !== 'string' ? opt.imageUrl : undefined

                        // Result calculation
                        const count = voteCounts[text] || 0
                        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0

                        // User selection state
                        const isSelected = selectedOption === text
                        const isMyChoice = currentUserVote?.selectedOption === text

                        return (
                            <div key={idx} className={`relative rounded-lg border-2 transition-all overflow-hidden ${isVotingMode
                                ? (isSelected ? 'border-primary' : 'border-border hover:border-border/80')
                                : (isMyChoice ? 'border-primary ring-1 ring-primary' : 'border-border')
                                }`}>
                                {/* Result Background Bar Animation */}
                                {!isVotingMode && (
                                    <div
                                        className="absolute top-0 left-0 bottom-0 bg-primary/10 transition-all duration-1000 ease-out z-0"
                                        style={{ width: `${percent}%` }}
                                    />
                                )}

                                <label className={`flex items-center p-3 gap-3 w-full h-full relative z-10 ${isVotingMode ? 'cursor-pointer' : ''}`}>
                                    {isVotingMode ? (
                                        <input
                                            type="radio"
                                            name={`poll-${poll.id}`}
                                            value={text}
                                            checked={isSelected}
                                            onChange={() => setSelectedOption(text)}
                                            className="w-4 h-4 text-primary shrink-0"
                                        />
                                    ) : (
                                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                            {isMyChoice && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                        </div>
                                    )}

                                    {imageUrl && (
                                        <div className="w-10 h-10 relative rounded overflow-hidden shrink-0 bg-muted">
                                            <Image src={imageUrl} alt={text} fill sizes="40px" className="object-cover" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="font-medium truncate text-sm">{text}</span>
                                            {!isVotingMode && (
                                                <span className="font-bold text-xs bg-background/50 px-2 py-0.5 rounded backdrop-blur-sm shadow-sm whitespace-nowrap">
                                                    {percent}% <span className="text-muted-foreground font-normal text-xs">({count})</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </label>

                                {isVotingMode && isSelected && isOther && (
                                    <div className="p-3 pt-0 animate-in slide-in-from-top-2 relative z-20">
                                        <Input
                                            placeholder="Type your answer..."
                                            value={customText}
                                            onChange={(e) => setCustomText(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Action Buttons - Always at bottom */}
                <div className="mt-auto pt-4 border-t">
                    {isVotingMode ? (
                        <Button className="w-full" onClick={handleVoteSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Vote"}
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>{totalVotes} total votes</span>
                                <Button variant="link" size="sm" onClick={handleChangeVote} className="h-auto p-0">
                                    Change Vote
                                </Button>
                            </div>
                            {hasOther && (
                                <Button variant="outline" className="w-full" onClick={loadCustomAnswers}>
                                    Show Custom Answers
                                </Button>
                            )}
                        </div>
                    )}
                </div>

            </CardContent>

            <Dialog open={customAnswersOpen} onOpenChange={setCustomAnswersOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Community Answers</DialogTitle>
                        <DialogDescription>See what others have computed.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] pr-4">
                        {loadingCustomAnswers ? (
                            <div className="flex justify-center p-8"><AlertCircle className="animate-spin w-8 h-8 text-muted-foreground" /></div>
                        ) : customAnswers.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No custom answers yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {customAnswers.map((ans, i) => (
                                    <div key={i} className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
                                        <Avatar className="w-8 h-8 border">
                                            <AvatarFallback>{ans.resolvedName[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold">{ans.resolvedName}</p>
                                            <p className="text-sm">{ans.customText}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {ans.updatedAt?.seconds ? formatDistanceToNow(new Date(ans.updatedAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
