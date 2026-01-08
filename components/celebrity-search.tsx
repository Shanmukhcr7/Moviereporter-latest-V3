"use client"

import * as React from "react"
import { Search, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { cn, getImageUrl } from "@/lib/utils"
// Removed motion import to avoid missing dependency issues
// import { motion, AnimatePresence } from "framer-motion"

interface CelebritySearchProps {
    onSearch: (term: string) => void
    initialValue?: string
    className?: string
}

export function CelebritySearch({ onSearch, initialValue = "", className }: CelebritySearchProps) {
    const [value, setValue] = React.useState(initialValue)
    const [suggestions, setSuggestions] = React.useState<any[]>([])
    const [open, setOpen] = React.useState(false)
    const [allItems, setAllItems] = React.useState<any[]>([])
    const [isFocused, setIsFocused] = React.useState(false)

    React.useEffect(() => {
        const cacheKey = "celebrity_search_index"
        const cacheTimeKey = "celebrity_search_index_time"
        const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

        const fetchAllNames = async () => {
            try {
                const cachedData = localStorage.getItem(cacheKey)
                const cachedTime = localStorage.getItem(cacheTimeKey)

                if (cachedData && cachedTime) {
                    const now = Date.now()
                    if (now - parseInt(cachedTime) < CACHE_DURATION) {
                        setAllItems(JSON.parse(cachedData))
                        return
                    }
                }

                const colRef = collection(db, "artifacts/default-app-id/celebrities")
                const snapshot = await getDocs(colRef)
                const allCelebs = snapshot.docs.map(doc => {
                    const d = doc.data()
                    return {
                        id: doc.id,
                        name: d.name,
                        role: d.role,
                        image: d.image || d.imageUrl || d.posterUrl || d.profileImage,
                    }
                })

                setAllItems(allCelebs)
                localStorage.setItem(cacheKey, JSON.stringify(allCelebs))
                localStorage.setItem(cacheTimeKey, Date.now().toString())

            } catch (e) {
                console.error("Failed to load search index", e)
            }
        }

        fetchAllNames()
    }, [])

    React.useEffect(() => {
        if (value.length < 1) {
            setSuggestions([])
            return
        }
        const lower = value.toLowerCase()
        const matches = allItems.filter(item => item.name?.toLowerCase().includes(lower))

        matches.sort((a, b) => {
            const aName = a.name.toLowerCase()
            const bName = b.name.toLowerCase()
            const aStarts = aName.startsWith(lower)
            const bStarts = bName.startsWith(lower)
            if (aStarts && !bStarts) return -1
            if (!aStarts && bStarts) return 1
            return 0
        })

        setSuggestions(matches.slice(0, 5))
    }, [value, allItems])

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        setOpen(false)
        onSearch(value)
    }

    const handleSelect = (name: string) => {
        setValue(name)
        setOpen(false)
        onSearch(name)
    }

    const handleClear = () => {
        setValue("")
        onSearch("")
        setSuggestions([])
    }

    return (
        <div className={cn("relative z-20 w-full max-w-2xl mx-auto", className)}>
            <div
                className={cn(
                    "relative flex items-center transition-all duration-300 ease-out",
                    "bg-background/80 backdrop-blur-xl border border-primary/20",
                    "shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.1)]",
                    isFocused ? "shadow-[0_0_30px_-5px_rgba(var(--primary-rgb),0.3)] border-primary/50 scale-[1.02]" : "hover:border-primary/40",
                    "rounded-full h-14 md:h-16 px-2 pr-2"
                )}
            >
                {/* Search Icon */}
                <div className="pl-4 md:pl-6 text-muted-foreground">
                    <Search className={cn("w-5 h-5 md:w-6 md:h-6 transition-colors", isFocused ? "text-primary" : "")} />
                </div>

                {/* Input Field */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        setOpen(true)
                        if (e.target.value.length === 0) onSearch("")
                    }}
                    onFocus={() => {
                        setIsFocused(true)
                        if (suggestions.length > 0) setOpen(true)
                    }}
                    onBlur={() => {
                        // Delay blurring to allow clicks on suggestions
                        setTimeout(() => setIsFocused(false), 200)
                    }}
                    placeholder="Search for your favorite stars..."
                    className="flex-1 bg-transparent border-none outline-none h-full px-4 text-base md:text-lg placeholder:text-muted-foreground/50 w-full min-w-0"
                />

                {/* Actions Group */}
                <div className="flex items-center gap-2 pr-2">
                    {/* Clear Button */}
                    {value && (
                        <button
                            onClick={handleClear}
                            className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    )}

                    {/* Search Button */}
                    <Button
                        onClick={() => handleSubmit()}
                        size="icon"
                        className={cn(
                            "rounded-full h-10 w-10 md:h-12 md:w-12 shrink-0 transition-all duration-300",
                            "bg-primary text-primary-foreground shadow-lg hover:shadow-primary/50",
                            "hover:scale-105 active:scale-95"
                        )}
                    >
                        <Search className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {open && suggestions.length > 0 && (
                <div className="absolute top-full left-4 right-4 mt-2 origin-top animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-background/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                        <div className="p-2 space-y-1">
                            {suggestions.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/10 cursor-pointer transition-all duration-200 group"
                                    onClick={() => handleSelect(item.name)}
                                >
                                    <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full overflow-hidden border-2 border-background shadow-md group-hover:border-primary/50 transition-colors">
                                        <img
                                            src={getImageUrl(item.image || "/placeholder.svg")}
                                            alt={item.name}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-base md:text-lg truncate group-hover:text-primary transition-colors">
                                            {item.name}
                                        </span>
                                        <span className="text-xs md:text-sm text-muted-foreground truncate">
                                            {item.role || "Celebrity"}
                                        </span>
                                    </div>
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                        <Search className="w-4 h-4 text-primary" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Click Outside Overlay */}
            {open && (
                <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
            )}
        </div>
    )
}
