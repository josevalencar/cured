"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  disabled?: boolean
}

export function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-[200px] justify-start gap-2 text-left font-normal"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
          {value ? format(value, "MMMM d, yyyy") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          disabled={(date) => date > new Date()}
          captionLayout="dropdown"
          startMonth={new Date(2021, 0)}
          endMonth={new Date()}
          defaultMonth={value ?? new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
