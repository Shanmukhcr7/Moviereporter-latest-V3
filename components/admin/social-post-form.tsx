"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addDoc, collection, doc, updateDoc, Timestamp } from "firebase/firestore"
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
import { Loader2 } from "lucide-react"

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
                        <FormItem>
                            <FormLabel>Celebrity Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Shah Rukh Khan" {...field} disabled={loading} />
                            </FormControl>
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
