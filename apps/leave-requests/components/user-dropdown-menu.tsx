"use client"
import { User, Settings, LogOut, Shield, Monitor, Sun, Moon, Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@workspace/ui/components/dropdown-menu"
import { useRouter } from "next/navigation"
import { createBrowserClient, type User as SupabaseUser } from "@workspace/supabase"
import { useCallback } from "react"
import { getUserInitials, getUserDisplayName } from "@/lib/utils"
import { useTheme } from "next-themes"

interface UserDropdownMenuProps {
  user?: SupabaseUser | null
  userProfile?: {
    role: 'employee' | 'manager' | 'admin'
  } | null
}

export function UserDropdownMenu({ user, userProfile }: UserDropdownMenuProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

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

  const themeOptions = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ]

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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Settings className="w-4 h-4 mr-2" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {option.label}
                  </div>
                  {theme === option.value && (
                    <Check className="w-4 h-4" />
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
          <>
            <DropdownMenuSeparator />
            {userProfile?.role === 'manager' && (
              <DropdownMenuItem onClick={() => router.push('/manager')}>
                <Shield className="w-4 h-4 mr-2" />
                Manager Dashboard
              </DropdownMenuItem>
            )}
            {userProfile?.role === 'admin' && (
              <DropdownMenuItem onClick={() => router.push('/admin')}>
                <Shield className="w-4 h-4 mr-2" />
                Admin Dashboard
              </DropdownMenuItem>
            )}
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