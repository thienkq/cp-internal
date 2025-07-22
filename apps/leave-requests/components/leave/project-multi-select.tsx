"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, X, Plus } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"

interface Project {
  id: string
  name: string
}

interface ProjectSelection {
  id: string | null
  name: string
}

interface ProjectMultiSelectProps {
  projects: Project[]
  value: ProjectSelection[]
  onChange: (value: ProjectSelection[]) => void
}

export function ProjectMultiSelect({ projects, value, onChange }: ProjectMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [customProjectName, setCustomProjectName] = useState("")

  const selectedProjectIds = value.map(p => p.id).filter(Boolean)

  const addProject = (project: Project) => {
    if (!selectedProjectIds.includes(project.id)) {
      onChange([...value, { id: project.id, name: project.name }])
    }
  }

  const addCustomProject = () => {
    const name = customProjectName.trim()
    if (name && !value.some(p => p.name === name)) {
      onChange([...value, { id: null, name }])
      setCustomProjectName("")
    }
  }

  const removeProject = (project: ProjectSelection) => {
    onChange(value.filter(p => p.id !== project.id || p.name !== project.name))
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
            {value.length === 0 ? "Select projects..." : `${value.length} project(s) selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search projects..." />
            <CommandList>
              <CommandEmpty>No projects found.</CommandEmpty>
              <CommandGroup>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => {
                      addProject(project)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProjectIds.includes(project.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {project.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          
          <div className="border-t p-3">
            <div className="text-xs text-muted-foreground mb-2">Add other project:</div>
            <div className="flex gap-2">
              <Input
                placeholder="Add project name"
                value={customProjectName}
                onChange={(e) => setCustomProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomProject()
                  }
                }}
                className="text-sm"
              />
              <Button size="sm" onClick={addCustomProject}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((project, index) => (
            <Badge key={`${project.id}-${index}`} variant="secondary" className="gap-1">
              {project.name}
              {project.id === null && <span className="text-xs">(other)</span>}
              <button
                type="button"
                onClick={() => removeProject(project)}
                className="hover:bg-destructive hover:text-destructive-foreground rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
} 