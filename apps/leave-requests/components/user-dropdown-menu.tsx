"use client"
import { User, Settings, LogOut } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { useRouter } from "next/navigation"
import { createBrowserClient, type User as SupabaseUser } from "@workspace/supabase"
import { useCallback } from "react"
import { getUserInitials, getUserDisplayName } from "@/lib/utils"

interface UserDropdownMenuProps {
  user?: SupabaseUser | null
}

export function UserDropdownMenu({ user }: UserDropdownMenuProps) {
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error('Sign out error:', error)
      // You might want to show a toast notification here
    }
  }, [router])

  const userInitials = getUserInitials(user)
  const displayName = getUserDisplayName(user)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-8 w-8 rounded-full p-0`}>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <User className="w-4 h-4 mr-2" />
          {displayName}
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
  )
} 