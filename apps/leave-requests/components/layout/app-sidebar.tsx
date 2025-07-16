"use client"

import type * as React from "react"
import { Calendar, Home, Settings, BarChart3, Plus, Users, FileText, Briefcase } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"

const navigationItems = [
  {
    title: "My Profile",
    url: "/dashboard/profile",
    icon: Home,
  },
  {
    title: "My Requests",
    url: "/requests",
    icon: FileText,
  },
  {
    title: "My Projects",
    url: "/my-assignments",
    icon: Briefcase,
  },
  {
    title: "My Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Team Calendar",
    url: "/calendar",
    icon: Calendar,
  },

  {
    title: "Official holidays",
    url: "/holidays",
    icon: Calendar,
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()

  const handleAddNewClick = () => {
    router.push("/leave/new")
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-gray-900">CoderPush</span>
            <span className="text-sm text-gray-600 -mt-1">Leaves</span>
          </div>
        </div>
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm"
          onClick={handleAddNewClick}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add new
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
