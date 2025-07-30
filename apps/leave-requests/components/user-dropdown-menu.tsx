"use client"
import { User, Settings, LogOut, Shield } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@workspace/ui/components/dropdown-menu"
import { useRouter } from "next/navigation"
import { createBrowserClient, type User as SupabaseUser } from "@workspace/supabase"
import { useCallback } from "react"
import { getUserInitials, getUserDisplayName } from "@/lib/utils"

interface UserDropdownMenuProps {
  user?: SupabaseUser | null
  userProfile?: {
    role: 'employee' | 'manager' | 'admin'
  } | null
}

export function UserDropdownMenu({ user, userProfile }: UserDropdownMenuProps) {
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
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <User className="w-4 h-4 mr-2" />
          {displayName}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        {userProfile?.role === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <Shield className="w-4 h-4 mr-2" />
              Admin Dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 