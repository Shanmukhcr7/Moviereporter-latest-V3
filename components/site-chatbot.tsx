"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, X, Send, Film, Newspaper, Loader2, Bot } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import Image from "next/image"

type Message = {
    id: string
    role: "user" | "bot"
    content: string
    type?: "text" | "movie-list" | "news-list" | "celebrity-list"
    data?: any[]
    timestamp: Date
}

export function SiteChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "bot",
            content: "Hi! I'm the Movie Lovers Assistant. I can help you find movies, news, celebrities, or latest updates.",
            timestamp: new Date()
        }
    ])
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsTyping(true)

        // Simulate thinking delay for realism
        setTimeout(async () => {
            const response = await processQuery(userMsg.content)
            setMessages(prev => [...prev, response])
            setIsTyping(false)
        }, 1000)
    }

    const processQuery = async (text: string): Promise<Message> => {
        const lower = text.toLowerCase()
        const now = Timestamp.now()

        // Intent: Specific "Tell me about" or "Who is" (person or movie)
        // We try to extract the term and search both collections
        if (lower.includes("tell me about") || lower.includes("who is") || lower.includes("search for") || lower.includes("find")) {
            const term = lower.replace(/tell me about|who is|search for|find/g, "").trim()

            if (term.length > 2) {
                // Try to Capitalize for Firestore (basic heuristic: "chiranjeevi" -> "Chiranjeevi")
                const capitalizedTerm = term.charAt(0).toUpperCase() + term.slice(1)

                try {
                    // 1. Try Celebrity Search
                    const celRef = collection(db, "artifacts/default-app-id/celebrities")
                    // Try exact-ish match logic
                    const celSnap = await getDocs(query(celRef, where("name", ">=", capitalizedTerm), where("name", "<=", capitalizedTerm + '\uf8ff'), limit(5)))

                    if (!celSnap.empty) {
                        const results = celSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                        return {
                            id: Date.now().toString(),
                            role: "bot",
                            content: "I found this celebrity:",
                            type: "celebrity-list",
                            data: results,
                            timestamp: new Date()
                        }
                    }

                    // 2. Try Movie Search
                    const movRef = collection(db, "artifacts/default-app-id/movies")
                    const movSnap = await getDocs(query(movRef, where("title", ">=", capitalizedTerm), where("title", "<=", capitalizedTerm + '\uf8ff'), limit(5)))

                    if (!movSnap.empty) {
                        const results = movSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                        return {
                            id: Date.now().toString(),
                            role: "bot",
                            content: "I found this movie:",
                            type: "movie-list",
                            data: results,
                            timestamp: new Date()
                        }
                    }
                } catch (e) {
                    console.error("Search Error", e)
                }
            }
        }

        // Intent: Celebrity / Cast (Generic)
        if (lower.includes("actor") || lower.includes("actress") || lower.includes("director") || lower.includes("star") || lower.includes("celebrity") || lower.includes("cast")) {
            try {
                const celRef = collection(db, "artifacts/default-app-id/celebrities")
                let q = query(celRef, limit(5))

                // Basic Name Search (Prefix match simulation) or specific roles
                if (lower.includes("director")) q = query(celRef, where("role", "==", "Director"), limit(5))

                // Note: Firestore doesn't support native full-text search.
                // We'll fetch a batch and filter client-side for better simple matching or use the 'limit' query if generic.
                const snap = await getDocs(q)

                // Simple client-side fuzzy match for name if the user typed a name
                // e.g. "Who is Prabhas"
                let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

                // Crude keywords filter if specific name mentioned
                const words = lower.split(" ").filter(w => w.length > 3 && !["actor", "who", "is", "show", "me", "star"].includes(w))
                if (words.length > 0) {
                    // Try to match name
                    // Since we can't query "contains", we rely on the limited fetch unless we fetch ALL (expensive).
                    // Ideally, we'd have a separate Algolia/MeiliSearch.
                    // Fallback: If query was generic, show top celebs. If specific, we might miss them in the 'limit(5)'.
                    // Let's rely on generic "Show me actors" for now, or fetch more.
                }

                if (results.length === 0) return { id: Date.now().toString(), role: "bot", content: "No celebrities found.", timestamp: new Date() }

                return {
                    id: Date.now().toString(),
                    role: "bot",
                    content: "Here are some popular celebrities:",
                    type: "celebrity-list",
                    data: results,
                    timestamp: new Date()
                }

            } catch (e) {
                return { id: Date.now().toString(), role: "bot", content: "Could not fetch celebrity info.", timestamp: new Date() }
            }
        }

        // Intent: Movies (Action, Drama, Recent, etc.)
        if (lower.includes("movie") || lower.includes("film") || lower.includes("action") || lower.includes("drama") || lower.includes("comedy") || lower.includes("tollywood")) {
            try {
                const moviesRef = collection(db, "artifacts/default-app-id/movies")
                let q = query(moviesRef, where("releaseDate", "<=", now), orderBy("releaseDate", "desc"), limit(5))

                // Simple Genre Matching
                if (lower.includes("action")) q = query(moviesRef, where("genre", "array-contains", "Action"), limit(5))
                else if (lower.includes("drama")) q = query(moviesRef, where("genre", "array-contains", "Drama"), limit(5))
                else if (lower.includes("comedy")) q = query(moviesRef, where("genre", "array-contains", "Comedy"), limit(5))
                else if (lower.includes("tollywood")) q = query(moviesRef, where("industry", "==", "Tollywood"), orderBy("releaseDate", "desc"), limit(5))

                const snap = await getDocs(q)
                if (snap.empty) {
                    return { id: Date.now().toString(), role: "bot", content: "I couldn't find any specific movies matching that right now.", timestamp: new Date() }
                }

                const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                return {
                    id: Date.now().toString(),
                    role: "bot",
                    content: `Here are some movies I found for you:`,
                    type: "movie-list",
                    data: results,
                    timestamp: new Date()
                }

            } catch (e) {
                console.error("Bot Error", e)
                return { id: Date.now().toString(), role: "bot", content: "I'm having trouble connecting to the movie database.", timestamp: new Date() }
            }
        }

        // Intent: News
        if (lower.includes("news") || lower.includes("update") || lower.includes("latest")) {
            try {
                const newsRef = collection(db, "artifacts/default-app-id/news")
                let q = query(newsRef, where("scheduledAt", "<=", now), orderBy("scheduledAt", "desc"), limit(3))

                if (lower.includes("tollywood")) q = query(newsRef, where("category", "==", "Tollywood"), orderBy("scheduledAt", "desc"), limit(3))

                const snap = await getDocs(q)
                const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

                if (results.length === 0) return { id: Date.now().toString(), role: "bot", content: "No recent news found.", timestamp: new Date() }

                return {
                    id: Date.now().toString(),
                    role: "bot",
                    content: "Here are the latest updates:",
                    type: "news-list",
                    data: results,
                    timestamp: new Date()
                }

            } catch (e) {
                return { id: Date.now().toString(), role: "bot", content: "I couldn't fetch the news right now.", timestamp: new Date() }
            }
        }

        // Default / Unknown
        return {
            id: Date.now().toString(),
            role: "bot",
            content: "I'm best at finding movies, celebrities, and news on this site. Try asking 'Show me actors' or 'Latest news'.",
            timestamp: new Date()
        }
    }

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-40 right-4 z-50 w-[90vw] md:w-[400px] h-[500px] max-h-[70vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-border/50 bg-background/95 backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border/50 bg-primary/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/20 rounded-full text-primary">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Movie Assistant</h3>
                                    <p className="text-xs text-muted-foreground">Ask only about website content</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] space-y-2`}>
                                        <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-muted rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>

                                        {/* Rich Content: Movie List */}
                                        {msg.type === 'movie-list' && msg.data && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                                                {msg.data.map((m: any) => (
                                                    <Link key={m.id} href={`/movie/${m.id}`} className="min-w-[120px] w-[120px] snap-center">
                                                        <div className="aspect-[2/3] relative rounded-lg overflow-hidden mb-1 border border-border/20">
                                                            <Image src={m.poster || m.posterUrl || "/placeholder.svg"} alt={m.title} fill className="object-cover" />
                                                        </div>
                                                        <p className="text-xs font-semibold truncate">{m.title}</p>
                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Film className="h-3 w-3" /> {m.industry}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        {/* Rich Content: Celebrity List */}
                                        {msg.type === 'celebrity-list' && msg.data && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                                                {msg.data.map((c: any) => (
                                                    <Link key={c.id} href={`/celebrity/${c.id}`} className="min-w-[100px] w-[100px] snap-center text-center">
                                                        <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-primary/20 mb-1 relative">
                                                            <Image src={c.profileImage || c.image || c.imageUrl || c.posterUrl || "/placeholder.svg"} alt={c.name} fill className="object-cover" />
                                                        </div>
                                                        <p className="text-xs font-semibold truncate">{c.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{c.role || "Actor"}</p>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        {/* Rich Content: News List */}
                                        {msg.type === 'news-list' && msg.data && (
                                            <div className="space-y-2">
                                                {msg.data.map((n: any) => (
                                                    <Link key={n.id} href={`/news/${n.id}`} className="flex gap-3 bg-card border border-border/20 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                        <div className="relative w-16 h-10 flex-shrink-0 rounded overflow-hidden">
                                                            <Image src={n.imageUrl || n.image || "/placeholder.svg"} alt={n.title} fill className="object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium line-clamp-2">{n.title}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.scheduledAt?.seconds * 1000).toLocaleDateString()}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-muted p-3 rounded-2xl rounded-tl-none">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleSend()
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about movies..."
                                    className="bg-muted/50 border-0 focus-visible:ring-1"
                                />
                                <Button type="button" size="icon" onClick={handleSend} disabled={!input.trim() || isTyping}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                style={{
                    boxShadow: "0 4px 14px 0 rgba(0, 118, 255, 0.39)" // Custom glow
                }}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
            </motion.button>
        </>
    )
}
