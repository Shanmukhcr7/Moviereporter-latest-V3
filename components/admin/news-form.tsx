"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addDoc, collection, doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { logAdminAction } from "@/lib/logger"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Loader2, CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

const newsCategories = [
    "Tollywood", "Bollywood", "Kollywood", "Sandalwood", "Hollywood", "Mollywood", "Pan India",
    "Sports", "Cricket", "Technology", "Politics", "Finance"
]

const formSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    author: z.string().min(2, "Author name is required"),
    imageUrl: z.string().min(1, "Cover image is required"),
    category: z.string().optional(), // Optional for Blogs
    summary: z.string().optional(),
    content: z.string().min(10, "Content is required"),
    scheduledPublish: z.date().optional(),
    isPromotion: z.boolean().default(false),
    isWeeklyMagazine: z.boolean().default(false),
})

interface NewsFormProps {
    initialData?: any | null
    type: "news" | "blog"
    onSuccess: () => void
}

export function NewsForm({ initialData, type, onSuccess }: NewsFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            scheduledPublish: initialData.scheduledPublish?.toDate(),
        } : {
            title: "",
            author: "",
            imageUrl: "",
            category: "",
            summary: "",
            content: "",
            isPromotion: false,
            isWeeklyMagazine: false,
        },
    })

    // Reset form when initialData changes (fixes "edit only once" bug)
    useEffect(() => {
        if (initialData) {
            form.reset({
                title: initialData.title || "",
                author: initialData.author || "",
                imageUrl: initialData.imageUrl || "",
                category: initialData.category || "",
                summary: initialData.summary || "",
                content: initialData.content || "",
                isPromotion: initialData.isPromotion || false,
                isWeeklyMagazine: initialData.isWeeklyMagazine || false,
                scheduledPublish: initialData.scheduledPublish?.toDate ? initialData.scheduledPublish.toDate() : undefined,
            })
        } else {
            form.reset({
                title: "",
                author: "",
                imageUrl: "",
                category: "",
                summary: "",
                content: "",
                isPromotion: false,
                isWeeklyMagazine: false,
            })
        }
    }, [initialData, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        try {
            // Correct collection names based on rules
            // Rules have: artifacts/{appId}/news and artifacts/{appId}/blogs
            const collectionName = type === "news"
                ? "artifacts/default-app-id/news"
                : "artifacts/default-app-id/blogs"

            const docData = {
                ...values,
                scheduledPublish: values.scheduledPublish || null,
                category: values.category || null,
                summary: values.summary || null,
                type, // Explicitly store type
                updatedAt: Timestamp.now(),
            }

            if (initialData) {
                await updateDoc(doc(db, collectionName, initialData.id), docData)
                toast.success(`${type === "news" ? "News" : "Blog"} updated`)

                await logAdminAction({
                    action: "UPDATE",
                    resourceType: type === "news" ? "News" : "Blog",
                    resourceId: initialData.id,
                    resourceTitle: values.title,
                    details: `Updated ${type} content`
                })
            } else {
                const docRef = await addDoc(collection(db, collectionName), {
                    ...docData,
                    createdAt: Timestamp.now(),
                })
                toast.success(`${type === "news" ? "News" : "Blog"} published`)

                await logAdminAction({
                    action: "CREATE",
                    resourceType: type === "news" ? "News" : "Blog",
                    resourceId: docRef.id,
                    resourceTitle: values.title,
                    details: `Published new ${type}`
                })
            }
            onSuccess()
        } catch (error) {
            console.error("Error saving:", error)
            toast.error("Failed to save content")
        } finally {
            setLoading(false)
        }
    }

    const onError = (errors: any) => {
        console.error("Form validation errors:", errors)
        toast.error("Please check the form for errors")
        setLoading(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">

                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cover Image</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    onRemove={() => field.onChange("")}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Article Headline" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="author"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Author</FormLabel>
                                <FormControl>
                                    <Input placeholder="Writer's Name" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Summary</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Brief summary or excerpt..."
                                    className="h-20 resize-none"
                                    {...field}
                                    disabled={loading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Category - Only show for News */}
                {type === "news" && (
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {newsCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                                {/* Simple Textarea for now, could be Rich Text later */}
                                <Textarea
                                    placeholder="Write your article here..."
                                    {...field}
                                    disabled={loading}
                                    className="min-h-[200px]"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/20">
                    {/* Scheduling */}
                    <FormField
                        control={form.control}
                        name="scheduledPublish"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Schedule Publish</FormLabel>
                                <FormControl>
                                    <Input
                                        type="datetime-local"
                                        placeholder="Select date and time"
                                        value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : undefined;
                                            field.onChange(date);
                                        }}
                                        disabled={loading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Checkboxes */}
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="isPromotion"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Is Promotion?</FormLabel>
                                        <FormDescription>Mark as promotional content.</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isWeeklyMagazine"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Weekly Magazine</FormLabel>
                                        <FormDescription>Feature in the weekly magazine section.</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={loading} size="lg">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {initialData ? "SaveChanges" : "Publish"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
