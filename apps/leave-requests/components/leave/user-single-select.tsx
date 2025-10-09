"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"

interface User {
  id: string
  full_name: string
  email: string
}

interface UserSingleSelectProps {
  users: User[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
}

export function UserSingleSelect({ 
  users, 
  value, 
  onChange, 
  placeholder = "Select user..." 
}: UserSingleSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedUser = users.find(user => user.id === value)

  const selectUser = (userId: string) => {
    onChange(userId)
    setOpen(false)
  }

  const clearSelection = () => {
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedUser ? (
              <div className="flex flex-col items-start">
                <span>{selectedUser.full_name || selectedUser.email}</span>
                <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
              </div>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {value && (
                  <CommandItem
                    onSelect={clearSelection}
                    className="text-muted-foreground"
                  >
                    <div className="flex items-center">
                      <span>Clear selection</span>
                    </div>
                  </CommandItem>
                )}
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => selectUser(user.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{user.full_name || user.email}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
