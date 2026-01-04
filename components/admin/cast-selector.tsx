"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Plus, X, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CastMember {
    id: string
    name: string
    role: string
    imageUrl: string
}

interface CastSelectorProps {
    value: CastMember[]
    onChange: (cast: CastMember[]) => void
    disabled?: boolean
}

export function CastSelector({ value = [], onChange, disabled }: CastSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [suggestions, setSuggestions] = useState<CastMember[]>([])
    const [loading, setLoading] = useState(false)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 1) {
                searchCelebrities()
            } else {
                setSuggestions([])
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const searchCelebrities = async () => {
        setLoading(true)
        try {
            // In a real app with many records, Algolia or a specialized search index is better.
            // Firestore simplistic search (case-sensitive) or just fetching logic.
            // For this demo, we'll fetch all and filter client side if list is small, 
            // OR use >= and <= for prefix search. Trie prefix search:

            const q = query(
                collection(db, "artifacts/default-app-id/celebrities"),
                // Simple prefix search trick for Firestore
                where("name", ">=", searchQuery),
                where("name", "<=", searchQuery + "\uf8ff"),
                limit(5)
            )

            const snapshot = await getDocs(q)
            const results: CastMember[] = []
            snapshot.forEach(doc => {
                const data = doc.data()
                // Avoid adding already selected cast
                if (!value.find(c => c.id === doc.id)) {
                    results.push({
                        id: doc.id,
                        name: data.name,
                        role: data.role,
                        imageUrl: data.imageUrl
                    })
                }
            })
            setSuggestions(results)
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setLoading(false)
        }
    }

    const addCast = (celeb: CastMember) => {
        onChange([...value, celeb])
        setSearchQuery("")
        setSuggestions([])
    }

    const removeCast = (id: string) => {
        onChange(value.filter(c => c.id !== id))
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background focus-within:ring-2 focus-within:ring-ring">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search celebrity to add..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={disabled}
                        className="flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground text-sm"
                    />
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border rounded-md shadow-lg overflow-hidden">
                        {suggestions.map(celeb => (
                            <button
                                key={celeb.id}
                                type="button"
                                className="w-full flex items-center gap-3 p-2 hover:bg-accent text-left transition-colors"
                                onClick={() => addCast(celeb)}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={celeb.imageUrl} />
                                    <AvatarFallback>{celeb.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium">{celeb.name}</div>
                                    <div className="text-xs text-muted-foreground">{celeb.role}</div>
                                </div>
                                <Plus className="h-4 w-4 ml-auto text-muted-foreground" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Cast Grid */}
            {value.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {value.map(celeb => (
                        <div key={celeb.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/40 relative group">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={celeb.imageUrl} />
                                <AvatarFallback>{celeb.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <div className="text-sm font-medium truncate">{celeb.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{celeb.role}</div>
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-sm"
                                onClick={() => removeCast(celeb.id)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
