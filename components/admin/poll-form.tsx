"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
import { toast } from "sonner"
import { Loader2, Plus, Trash2, CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

const formSchema = z.object({
    question: z.string().min(5, "Question is required"),
    startDate: z.date(),
    endDate: z.date(),
    options: z.array(z.object({
        text: z.string().min(1, "Option text is required"),
        imageUrl: z.string().optional(),
        votes: z.number().default(0), // Keep existing votes if editing, or 0
        isOther: z.boolean().optional()
    })).min(2, "At least 2 options are required"),
})

interface PollFormProps {
    initialData?: any | null
    onSuccess: () => void
}

export function PollForm({ initialData, onSuccess }: PollFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            startDate: initialData.startDate?.toDate(),
            endDate: initialData.endDate?.toDate(),
        } : {
            question: "",
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
            options: [{ text: "", imageUrl: "", votes: 0, isOther: false }, { text: "", imageUrl: "", votes: 0, isOther: false }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options",
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        try {
            const docData = {
                ...values,
                updatedAt: Timestamp.now(),
            }

            if (initialData) {
                await updateDoc(doc(db, "artifacts/default-app-id/polls", initialData.id), docData)
                toast.success("Poll updated")
            } else {
                await addDoc(collection(db, "artifacts/default-app-id/polls"), {
                    ...docData,
                    totalVotes: 0,
                    createdAt: Timestamp.now(),
                })
                toast.success("Poll created")
            }
            onSuccess()
        } catch (error) {
            console.error("Error saving poll:", error)
            toast.error("Failed to save poll")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Poll Question</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Best Movie of 2024?" {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Start Date</FormLabel>
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
                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>End Date</FormLabel>
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

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel>Poll Options</FormLabel>
                        <div className="space-x-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "", imageUrl: "", votes: 0, isOther: false })}>
                                <Plus className="h-4 w-4 mr-2" /> Add Option
                            </Button>
                            {!fields.some(f => f.isOther) && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => append({ text: "Other", imageUrl: "", votes: 0, isOther: true })}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add "Other"
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className={cn("flex gap-4 items-start p-4 border rounded-md", field.isOther ? "bg-amber-500/10 border-amber-500/20" : "bg-muted/20")}>
                                <div className="flex-1 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name={`options.${index}.text`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder={`Option ${index + 1}`}
                                                        {...field}
                                                        disabled={loading || fields[index].isOther} // Disable editing text for 'Other' to ensure consistency
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {!fields[index].isOther && (
                                        <FormField
                                            control={form.control}
                                            name={`options.${index}.imageUrl`}
                                            render={({ field }) => (
                                                <FormItem>
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
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    disabled={fields.length <= 2}
                                    title="Remove Option"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={loading} size="lg">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {initialData ? "Save Changes" : "Create Poll"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
