"use client"

import * as React from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface AdminSearchProps {
    items: { id: string; label: string; value: string }[]
    onSelect: (id: string) => void
    placeholder?: string
    className?: string
}

export function AdminSearch({ items, onSelect, placeholder = "Search...", className }: AdminSearchProps) {
    const [query, setQuery] = React.useState("")
    const [suggestions, setSuggestions] = React.useState<{ id: string; label: string; value: string }[]>([])
    const [isOpen, setIsOpen] = React.useState(false)

    // Filter items based on query
    React.useEffect(() => {
        if (query.trim().length > 0) {
            const lowerQuery = query.toLowerCase()
            const filtered = items
                .filter((item) => item.label.toLowerCase().includes(lowerQuery))
                .slice(0, 10)

            setSuggestions(filtered)
            setIsOpen(true)
        } else {
            setSuggestions([])
            setIsOpen(false)
        }
    }, [query, items])

    const handleSelect = (id: string, label: string) => {
        setQuery(label)
        setSuggestions([])
        setIsOpen(false)
        onSelect(id)
    }

    // Close when clicking outside - simple version
    // For production robustness, a useOnClickOutside hook is better, but this suffices for Admin
    const wrapperRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [wrapperRef])

    return (
        <div ref={wrapperRef} className={cn("relative", className)}>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9 w-full"
                    onFocus={() => {
                        if (query.length > 0) setIsOpen(true)
                    }}
                />
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {suggestions.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleSelect(item.id, item.label)}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && query.length > 0 && suggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md p-2 text-sm text-center text-muted-foreground">
                    No results found.
                </div>
            )}
        </div>
    )
}
