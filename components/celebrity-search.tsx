"use client"

import * as React from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { collection, query, limit, getDocs, orderBy, startAt, endAt } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { cn } from "@/lib/utils"

interface CelebritySearchProps {
    onSearch: (term: string) => void
    initialValue?: string
    className?: string
}

export function CelebritySearch({ onSearch, initialValue = "", className }: CelebritySearchProps) {
    const [value, setValue] = React.useState(initialValue)
    const [suggestions, setSuggestions] = React.useState<any[]>([])
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [allItems, setAllItems] = React.useState<any[]>([])

    /* 
   * Enhanced Search Strategy:
   * To support "contains" search and case-insensitivity like the homepage (and solve the "not loaded" perception),
   * we will fetch the lightweight list of all celebrities (id, name, image) once (or cached) and filter client-side.
   * This is feasible for < ~2000 items. If it grows large, we'd need Algolia/MeiliSearch or a specific search field (array of keywords).
   */

    React.useEffect(() => {
        // Determine if we should preload all for suggestions? 
        // Yes, to ensure "Chiranjeevi" is found even if typing "ranjeevi" (substring) or "chiran" (case diff).
        const cacheKey = "celebrity_search_index"
        const cacheTimeKey = "celebrity_search_index_time"
        const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

        const fetchAllNames = async () => {
            try {
                // Check cache
                const cachedData = localStorage.getItem(cacheKey)
                const cachedTime = localStorage.getItem(cacheTimeKey)

                if (cachedData && cachedTime) {
                    const now = Date.now()
                    if (now - parseInt(cachedTime) < CACHE_DURATION) {
                        setAllItems(JSON.parse(cachedData))
                        // We can return here, but maybe we want to background refresh? 
                        // For now, simple cache hit is enough for speed.
                        return
                    }
                }

                const colRef = collection(db, "artifacts/default-app-id/celebrities")
                // Projection? Firestore client SDK doesn't support generic projection easily, matches return full docs usually.
                // We'll fetch all. Optimisation: Use a separate "search_index" collection if data is huge. 
                // For now, assuming manageable size.
                const snapshot = await getDocs(colRef) // Fetches ALL. 
                const allCelebs = snapshot.docs.map(doc => {
                    const d = doc.data()
                    return {
                        id: doc.id,
                        name: d.name,
                        role: d.role,
                        image: d.image || d.imageUrl || d.posterUrl || d.profileImage, // cache the image for suggestion display
                    }
                })

                setAllItems(allCelebs)

                // Save to cache
                localStorage.setItem(cacheKey, JSON.stringify(allCelebs))
                localStorage.setItem(cacheTimeKey, Date.now().toString())

            } catch (e) {
                console.error("Failed to load search index", e)
            }
        }

        fetchAllNames()
    }, [])

    // Filter suggestions from allItems based on value
    React.useEffect(() => {
        if (value.length < 1) {
            setSuggestions([])
            return
        }
        const lower = value.toLowerCase()

        // Sort relevance? Exact match first, then startsWith, then includes.
        const matches = allItems.filter(item => item.name?.toLowerCase().includes(lower))

        // Simple sort: startsWith > includes
        matches.sort((a, b) => {
            const aName = a.name.toLowerCase()
            const bName = b.name.toLowerCase()
            const aStarts = aName.startsWith(lower)
            const bStarts = bName.startsWith(lower)
            if (aStarts && !bStarts) return -1
            if (!aStarts && bStarts) return 1
            return 0
        })

        setSuggestions(matches.slice(0, 3)) // Limit to 3 as requested
    }, [value, allItems])

    /* Legacy debounce effect removed in favor of client-side allItems filter */

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

    return (
        <div className={cn("relative z-20", className)}>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value)
                            if (e.target.value.length === 0) {
                                onSearch("") // Clear search if input cleared
                            }
                        }}
                        onFocus={() => {
                            if (suggestions.length > 0) setOpen(true)
                        }}
                        placeholder="Search celebrities..."
                        className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    />
                    {loading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
                <Button type="submit" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-8">
                    Search
                </Button>
            </form>

            {/* Suggestions Dropdown */}
            {open && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-md border shadow-md p-1">
                    {suggestions.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 hover:bg-accent rounded-sm cursor-pointer transition-colors"
                            onClick={() => handleSelect(item.name)}
                        >
                            <div className="relative w-8 h-8 shrink-0">
                                {/* Handle images same way as cards */}
                                <img
                                    src={item.image || item.imageUrl || item.posterUrl || "/placeholder.svg"}
                                    alt={item.name}
                                    className="object-cover rounded-full w-full h-full"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground">{item.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Click outside to close - minimalistic approach: just close on selection or submit. 
          For a robust click-outside, we'd need a ref/hook. 
          For now, simplistic handling is accepted. */}
            {open && (
                <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
            )}
        </div>
    )
}
