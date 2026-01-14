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

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            postedAt: initialData.postedAt?.toDate(),
        } : {
            celebrityName: "",
            platform: "instagram",
            content: "",
            imageUrl: "",
            postUrl: "",
            postedAt: new Date(),
        },
    })

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [wrapperRef])

    const handleNameInput = async (value: string) => {
        if (value.length >= 2) {
            try {
                // Assuming 'celebrities' collection has a 'name' field
                const q = query(
                    collection(db, "artifacts/default-app-id/celebrities"),
                    where("name", ">=", value),
                    where("name", "<=", value + "\uf8ff"),
                    limit(5)
                )
                const snapshot = await getDocs(q)
                const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                setSuggestions(results)
                setShowSuggestions(true)
            } catch (err) {
                console.error("Error searching celebrities:", err)
            }
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
                                            field.onChange(e)
                                            handleNameInput(e.target.value)
                                        }}
                                        autoComplete="off"
                                    />
                                    {loading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                            </FormControl>

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-popover border rounded-md shadow-md mt-1 overflow-hidden">
                                    {suggestions.map((celebrity) => (
                                        <div
                                            key={celebrity.id}
                                            className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm flex items-center gap-2"
                                            onClick={() => {
                                                form.setValue("celebrityName", celebrity.name)
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
                                    onChange={field.onChange}
                                    onRemove={() => field.onChange("")}
                                    disabled={loading}
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
