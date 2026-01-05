"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
// Fixed imports
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.string().min(2, "Role is required"),
    description: z.string().optional(),
    imageUrl: z.string().min(1, "Image is required"),
})

interface CelebrityFormProps {
    initialData?: any | null
    onSuccess: () => void
}

export function CelebrityForm({ initialData, onSuccess }: CelebrityFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: "",
            role: "Actor",
            description: "",
            imageUrl: "",
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        try {
            if (initialData) {
                // Update
                await updateDoc(doc(db, "artifacts/default-app-id/celebrities", initialData.id), {
                    ...values,
                    updatedAt: Timestamp.now(),
                })
                toast.success("Celebrity updated successfully")
            } else {
                // Create
                await addDoc(collection(db, "artifacts/default-app-id/celebrities"), {
                    ...values,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                })
                toast.success("Celebrity added successfully")
            }
            onSuccess()
        } catch (error) {
            console.error("Error saving celebrity:", error)
            toast.error("Failed to save celebrity")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Profile Image</FormLabel>
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Prabhas" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Actor">Actor</SelectItem>
                                        <SelectItem value="Actress">Actress</SelectItem>
                                        <SelectItem value="Director">Director</SelectItem>
                                        <SelectItem value="Producer">Producer</SelectItem>
                                        <SelectItem value="Music Director">Music Director</SelectItem>
                                        <SelectItem value="Cinematographer">Cinematographer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description / Biography</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Bio..." {...field} disabled={loading} className="min-h-[100px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {initialData ? "Save Changes" : "Create Celebrity"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
