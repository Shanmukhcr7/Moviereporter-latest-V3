"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, CheckCircle2, Share2, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface VotingCardProps {
    nominee: any
    isVoted: boolean
    onVote: (id: string) => void
    onShare: (nominee: any) => void
    onCustomVote?: (id: string) => void
    onViewChoices?: (id: string) => void
    disabled?: boolean
    canChange?: boolean
}

export function VotingCard({ nominee, isVoted, onVote, onShare, onCustomVote, onViewChoices, disabled, canChange }: VotingCardProps) {
    const isOther = nominee.isOther === true

    return (
        <Card
            className={cn(
                "group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 backdrop-blur relative flex flex-col h-full",
                isVoted ? "border-primary bg-primary/5" : "border-border/50 bg-card/50"
            )}
        >
            <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                {isOther ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 cursor-default">
                        <span className="text-4xl">✨</span>
                    </div>
                ) : (
                    <Link href={`/celebrity/${nominee.celebrityId}`} className="block h-full w-full cursor-pointer">
                        <Image
                            src={nominee.celebrity?.image || nominee.celebrity?.imageUrl || nominee.celebrity?.posterUrl || "/placeholder.svg"}
                            alt={nominee.celebrity?.name || "Nominee"}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover object-top group-hover:scale-110 transition-transform duration-500"
                        />
                    </Link>
                )}

                {isVoted && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-2 animate-in zoom-in spin-in-90 duration-300 pointer-events-none">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 flex flex-col justify-end items-center text-center transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <h3 className="font-bold text-white text-base line-clamp-2 leading-tight drop-shadow-sm mb-1">
                        {isOther ? (
                            "Other Choice"
                        ) : (
                            <Link href={`/celebrity/${nominee.celebrityId}`} className="hover:text-primary transition-colors">
                                {nominee.celebrity?.name}
                            </Link>
                        )}
                    </h3>
                </div>
            </div>

            <CardContent className="p-2 flex flex-col h-full">
                {/* Movie Name Rendering */}
                {!isOther && (
                    <div className="mb-1 h-10 flex items-start justify-center text-center px-1 pt-0.5">
                        {nominee.movieId ? (
                            <Link href={`/movie/${nominee.movieId}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors hover:underline block line-clamp-2 leading-tight">
                                {nominee.movie?.title || "Unknown Movie"}
                            </Link>
                        ) : (
                            <span className="text-sm font-bold text-foreground block line-clamp-2 leading-tight">{nominee.movie?.title}</span>
                        )}
                    </div>
                )}

                <div className="flex gap-2 mt-auto">
                    {!isOther ? (
                        <>
                            <Button
                                className={cn("flex-1 font-semibold", isVoted && "bg-green-600 hover:bg-green-700 text-white")}
                                variant={isVoted ? "default" : "default"}
                                onClick={() => onVote(nominee.id)}
                                disabled={disabled}
                            >
                                {isVoted ? (canChange ? "Change Vote" : "Voted") : "Vote"}
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => onShare(nominee)} className="shrink-0">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        // Other Option Actions
                        <div className="flex flex-col gap-2 w-full">
                            <Button
                                className="w-full"
                                onClick={() => onCustomVote?.(nominee.id)}
                                disabled={disabled && !canChange} // Allow if change allowed
                            >
                                {isVoted ? "Change My Choice" : "Give My Choice"}
                            </Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => onViewChoices?.(nominee.id)}
                            >
                                View Others Choices
                            </Button>
                        </div>
                    )}
                </div>



                {isVoted && !canChange && (
                    <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Vote locked for 24h
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
