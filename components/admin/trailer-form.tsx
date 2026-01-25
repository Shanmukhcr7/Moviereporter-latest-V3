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
    type: z.enum(["trailer", "teaser"]),
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
            type: "trailer",
        },
    })

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        try {
            const videoId = getYouTubeId(values.youtubeUrl);
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";

            const docData = {
                ...values,
                thumbnailUrl,
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
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Inception Official Trailer" {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-md has-[:checked]:bg-accent hover:bg-accent/50 transition-colors">
                                    <input
                                        type="radio"
                                        value="trailer"
                                        checked={field.value === "trailer"}
                                        onChange={field.onChange}
                                        className="h-4 w-4"
                                    />
                                    <span>Trailer</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-md has-[:checked]:bg-accent hover:bg-accent/50 transition-colors">
                                    <input
                                        type="radio"
                                        value="teaser"
                                        checked={field.value === "teaser"}
                                        onChange={field.onChange}
                                        className="h-4 w-4"
                                    />
                                    <span>Teaser</span>
                                </label>
                            </div>
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
                            <FormDescription>The thumbnail will be automatically fetched from YouTube.</FormDescription>
                            <FormMessage />
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

