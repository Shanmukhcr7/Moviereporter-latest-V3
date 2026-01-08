"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
    date?: Date
    setDate: (date?: Date) => void
    disabled?: boolean // Make disabled optional
}

export function DateTimePicker({ date, setDate, disabled = false }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            setDate(undefined)
            return
        }
        const newDate = new Date(selectedDate)
        if (date) {
            newDate.setHours(date.getHours(), date.getMinutes())
        }
        setDate(newDate)
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(":").map(Number)
        const newDate = date ? new Date(date) : new Date()
        newDate.setHours(hours)
        newDate.setMinutes(minutes)
        setDate(newDate)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    {date ? format(date, "PPP p") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-100 text-primary" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                />
                <div className="p-3 border-t border-border space-y-3">
                    <Input
                        type="time"
                        value={date ? format(date, "HH:mm") : "00:00"}
                        onChange={handleTimeChange}
                    />
                    <Button className="w-full" size="sm" onClick={() => setIsOpen(false)}>
                        Done
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
