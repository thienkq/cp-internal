"use client"
import { Bell, HelpCircle, User, ArrowLeft, Settings, LogOut } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import { createBrowserClient } from "@workspace/supabase"

export function TopNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const isLeaveRequestPage = pathname === "/leave/new"

  const handleBack = () => {
    router.back()
  }

  const handleSignOut = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="border-b bg-white px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isLeaveRequestPage && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <span className="text-sm text-gray-600">{isLeaveRequestPage ? "New Leave Request" : "CoderPush Leaves"}</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-blue-500">
            <HelpCircle className="w-4 h-4 mr-1" />
            Support
          </Button>

          <Button variant="ghost" size="sm">
            <Bell className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-blue-500 text-white text-xs">CH</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
