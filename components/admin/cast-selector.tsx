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
    const [allCelebrities, setAllCelebrities] = useState<CastMember[]>([])
    const [suggestions, setSuggestions] = useState<CastMember[]>([])
    const [loading, setLoading] = useState(false)

    // Fetch all celebrities once on mount
    useEffect(() => {
        const fetchCelebs = async () => {
            const q = query(collection(db, "artifacts/default-app-id/celebrities"), limit(500)) // Fetch reasonable limit
            const snapshot = await getDocs(q)
            const results: CastMember[] = []
            snapshot.forEach(doc => {
                const data = doc.data()
                results.push({
                    id: doc.id,
                    name: data.name || "Unknown",
                    role: data.role || "Actor",
                    imageUrl: data.image || data.imageUrl || data.profileImage || ""
                })
            })
            setAllCelebrities(results)
        }
        fetchCelebs()
    }, [])

    // Filter locally
    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const lowerQuery = searchQuery.toLowerCase()
            const filtered = allCelebrities
                .filter(c =>
                    c.name.toLowerCase().includes(lowerQuery) &&
                    !value.find(selected => selected.id === c.id) // Exclude selected
                )
                .slice(0, 10) // Limit suggestions
            setSuggestions(filtered)
        } else {
            setSuggestions([])
        }
    }, [searchQuery, allCelebrities, value])

    // Remove old server-side search logic
    // const searchCelebrities = async () => { ... }

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
                    <div className="absolute top-full left-0 right-0 mt-1 z-[9999] bg-popover border rounded-md shadow-lg overflow-hidden max-h-[300px] overflow-y-auto">
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
