"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addDoc, collection, doc, updateDoc, Timestamp, query, where, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ImageUpload } from "@/components/admin/image-upload"
import { DateTimePicker } from "@/components/admin/date-time-picker"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Search } from "lucide-react"

const formSchema = z.object({
    celebrityName: z.string().min(2, "Name is required"),
    celebrityId: z.string().optional(),
    celebrityImage: z.string().optional(),
    platform: z.enum(["instagram", "twitter", "facebook", "other"]),
    content: z.string().min(1, "Post content is required"),
    imageUrl: z.string().optional(),
    postUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    postedAt: z.date(),
})

interface SocialPostFormProps {
    initialData?: any | null
    onSuccess: () => void
}

export function SocialPostForm({ initialData, onSuccess }: SocialPostFormProps) {
    const [loading, setLoading] = useState(false)
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [allCelebs, setAllCelebs] = useState<any[]>([]) // Store all celebs

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            postedAt: initialData.postedAt?.toDate(),
        } : {
            celebrityName: "",
            celebrityId: "",
            celebrityImage: "",
            platform: "instagram",
            content: "",
            imageUrl: "",
            postUrl: "",
            postedAt: new Date(),
        },
    })

    // Fetch all celebs on mount (Awards style)
    useEffect(() => {
        const fetchCelebs = async () => {
            try {
                const q = query(collection(db, "artifacts/default-app-id/celebrities"), limit(500))
                const snap = await getDocs(q)
                const celebs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                setAllCelebs(celebs)
            } catch (e) { console.error("Failed to fetch celebs", e) }
        }
        fetchCelebs()
    }, [])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [wrapperRef])

    const handleNameChange = (term: string) => {
        form.setValue("celebrityName", term)
        if (term.length > 0) {
            const lower = term.toLowerCase()
            const filtered = allCelebs.filter((c: any) => (c.name || "").toLowerCase().includes(lower)).slice(0, 5)
            setSuggestions(filtered)
            setShowSuggestions(true)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        // ... (existing submit logic)
        setLoading(true)
        try {
            const docData = {
                ...values,
                updatedAt: Timestamp.now(),
            }

            if (initialData) {
                await updateDoc(doc(db, "artifacts/default-app-id/social_posts", initialData.id), docData)
                toast.success("Post updated")
            } else {
                await addDoc(collection(db, "artifacts/default-app-id/social_posts"), {
                    ...docData,
                    createdAt: Timestamp.now(),
                    // comments: [] // Initialize empty if needed, but undefined is fine too as we use arrayUnion
                })
                toast.success("Post created")
            }
            onSuccess()
        } catch (error) {
            console.error("Error saving post:", error)
            toast.error("Failed to save post")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="celebrityName"
                    render={({ field }) => (
                        <FormItem className="relative" ref={wrapperRef}>
                            <FormLabel>Celebrity Name</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="e.g. Shah Rukh Khan"
                                        {...field}
                                        disabled={loading}
                                        onChange={(e) => {
                                            handleNameChange(e.target.value)
                                        }}
                                        onFocus={() => {
                                            if (field.value) setShowSuggestions(true)
                                        }}
                                        autoComplete="off"
                                    />
                                    {loading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                            </FormControl>

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-50 w-full bg-popover border rounded-md shadow-md mt-1 overflow-hidden">
                                    {suggestions.map((celebrity) => (
                                        <div
                                            key={celebrity.id}
                                            className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm flex items-center gap-2"
                                            onClick={() => {
                                                form.setValue("celebrityName", celebrity.name)
                                                form.setValue("celebrityId", celebrity.id)
                                                form.setValue("celebrityImage", celebrity.image || celebrity.imageUrl || celebrity.profileImage)
                                                setShowSuggestions(false)
                                            }}
                                        >
                                            <Search className="h-3 w-3 text-muted-foreground" />
                                            {celebrity.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* ... rest of form ... */}

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Platform</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select platform" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="twitter">X (Twitter)</SelectItem>
                                        <SelectItem value="facebook">Facebook</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="postedAt"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Post Date</FormLabel>
                                <FormControl>
                                    <DateTimePicker
                                        date={field.value}
                                        setDate={field.onChange}
                                        disabled={loading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="postUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Original Post URL (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://instagram.com/p/..." {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Caption / Content</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Paste the caption or post content here..."
                                    className="min-h-[100px]"
                                    {...field}
                                    disabled={loading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Image (Optional)</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value || ""}
                                    onChange={async (url) => {
                                        if (field.value && field.value !== url) {
                                            try {
                                                await fetch("/api/delete-file", {
                                                    method: "POST",
                                                    body: JSON.stringify({ url: field.value })
                                                });
                                            } catch (e) { console.error(e) }
                                        }
                                        field.onChange(url)
                                    }}
                                    onRemove={async () => {
                                        if (field.value) {
                                            try {
                                                await fetch("/api/delete-file", {
                                                    method: "POST",
                                                    body: JSON.stringify({ url: field.value })
                                                });
                                            } catch (e) { console.error(e) }
                                        }
                                        field.onChange("")
                                    }}
                                    disabled={loading}
                                    folder="celebrity-social-media"
                                />


                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={loading} size="lg">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {initialData ? "Save Changes" : "Create Post"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
