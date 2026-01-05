"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addDoc, collection, doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ImageUpload } from "@/components/admin/image-upload"
import { CastSelector } from "@/components/admin/cast-selector"
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

const industries = ["Tollywood", "Bollywood", "Kollywood", "Sandalwood", "Hollywood", "Mollywood", "Pan India"]
const ottPlatforms = ["Netflix", "Amazon Prime", "Disney+ Hotstar", "Zee5", "SonyLIV", "Aha", "JioCinema", "SunNXT", "YouTube"]

const formSchema = z.object({
    title: z.string().min(2, "Title is required"),
    genre: z.string().min(2, "Genre is required"),
    industry: z.string().min(1, "Industry is required"),
    releaseDate: z.date({ required_error: "Release date is required" }),
    description: z.string().optional(),
    posterUrl: z.string().min(1, "Poster image is required"),
    trailerUrl: z.string().optional(),
    boxOffice: z.string().optional(),
    ottPlatforms: z.array(z.string()).default([]),
    cast: z.array(z.any()).default([]),
    scheduledPublish: z.date().optional(),
})

interface MovieFormProps {
    initialData?: any | null
    onSuccess: () => void
}

export function MovieForm({ initialData, onSuccess }: MovieFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            releaseDate: initialData.releaseDate?.toDate(),
            scheduledPublish: initialData.scheduledPublish?.toDate(),
        } : {
            title: "",
            genre: "",
            industry: "",
            description: "",
            posterUrl: "",
            trailerUrl: "",
            boxOffice: "",
            ottPlatforms: [],
            cast: [],
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        try {
            const movieData = {
                ...values,
                // Sanitize undefined values
                scheduledPublish: values.scheduledPublish || null,
                boxOffice: values.boxOffice || "",
                trailerUrl: values.trailerUrl || "",
                description: values.description || "",
                // Convert JS dates to Firestore Timestamps
                updatedAt: Timestamp.now(),
            }

            if (initialData) {
                // Update
                await updateDoc(doc(db, "artifacts/default-app-id/movies", initialData.id), movieData)
                toast.success("Movie updated successfully")
            } else {
                // Create
                await addDoc(collection(db, "artifacts/default-app-id/movies"), {
                    ...movieData,
                    createdAt: Timestamp.now(),
                })
                toast.success("Movie added successfully")
            }
            onSuccess()
        } catch (error) {
            console.error("Error saving movie:", error)
            toast.error("Failed to save movie")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Movie Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Baahubali" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Industry</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Industry" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="genre"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Genre</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Action, Drama" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="releaseDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Release Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                disabled={loading}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Media */}
                <FormField
                    control={form.control}
                    name="posterUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Movie Poster</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    onRemove={() => field.onChange("")}
                                />
                            </FormControl>
                            <FormDescription>Upload vertical poster image.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="trailerUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>YouTube Trailer Link</FormLabel>
                            <FormControl>
                                <Input placeholder="https://youtube.com/..." {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description / Synposis</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Storyline..." {...field} disabled={loading} className="min-h-[100px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Cast */}
                <FormField
                    control={form.control}
                    name="cast"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cast & Crew</FormLabel>
                            <FormControl>
                                <CastSelector value={field.value} onChange={field.onChange} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Extra Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="boxOffice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Top Box Office (Collection)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 500Cr" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* OTT Selection */}
                    <FormField
                        control={form.control}
                        name="ottPlatforms"
                        render={() => (
                            <FormItem>
                                <FormLabel>OTT Platforms</FormLabel>
                                <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 max-h-[150px] overflow-y-auto">
                                    {ottPlatforms.map((item) => (
                                        <FormField
                                            key={item}
                                            control={form.control}
                                            name="ottPlatforms"
                                            render={({ field }) => {
                                                return (
                                                    <FormItem
                                                        key={item}
                                                        className="flex flex-row items-start space-x-2 space-y-0"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(item)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, item])
                                                                        : field.onChange(
                                                                            field.value?.filter(
                                                                                (value) => value !== item
                                                                            )
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-xs cursor-pointer">
                                                            {item}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Advanced Publishing */}
                <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Publishing Settings</h4>
                    <FormField
                        control={form.control}
                        name="scheduledPublish"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Scheduled Publish (Optional)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[240px] pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                disabled={loading}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                            disabled={(date) => date < new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>Leave empty to publish immediately.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading} size="lg">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {initialData ? "Save Movie Changes" : "Publish Movie"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
