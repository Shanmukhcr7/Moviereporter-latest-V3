"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addDoc, collection, doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    title: z.string().min(3, "Title is required"),
    youtubeUrl: z.string().url("Must be a valid URL"),
    thumbnailUrl: z.string().min(1, "Thumbnail is required"),
    isFeatured: z.boolean().default(false),
})

interface TrailerFormProps {
    initialData?: any | null
    onSuccess: () => void
}

export function TrailerForm({ initialData, onSuccess }: TrailerFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            title: "",
            youtubeUrl: "",
            thumbnailUrl: "",
            isFeatured: false,
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        try {
            const docData = {
                ...values,
                updatedAt: Timestamp.now(),
            }

            if (initialData) {
                await updateDoc(doc(db, "artifacts/default-app-id/trailers", initialData.id), docData)
                toast.success("Trailer updated")
            } else {
                await addDoc(collection(db, "artifacts/default-app-id/trailers"), {
                    ...docData,
                    createdAt: Timestamp.now(),
                })
                toast.success("Trailer added")
            }
            onSuccess()
        } catch (error) {
            console.error("Error saving trailer:", error)
            toast.error("Failed to save trailer")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="thumbnailUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Thumbnail Image</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
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
                                    onRemove={async (url) => {
                                        const urlToDelete = url || field.value;
                                        if (urlToDelete) {
                                            try {
                                                await fetch("/api/delete-file", {
                                                    method: "POST",
                                                    body: JSON.stringify({ url: urlToDelete })
                                                });
                                            } catch (e) { console.error(e) }
                                        }
                                        field.onChange("")
                                    }}
                                    folder="trailer-thumbnails"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trailer Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Inception Official Trailer" {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="youtubeUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>YouTube URL</FormLabel>
                            <FormControl>
                                <Input placeholder="https://www.youtube.com/watch?v=..." {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={loading}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Featured Trailer</FormLabel>
                                <FormDescription>
                                    Show this at the top of the trailers page.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={loading} size="lg">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {initialData ? "Save Changes" : "Add Trailer"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
