"use client"
import { UserDropdownMenu } from "@/components/user-dropdown-menu"
import { type User as SupabaseUser } from "@workspace/supabase"
import { createBrowserClient } from "@workspace/supabase"
import { useEffect, useState } from "react"

interface TopNavbarProps {
  user?: SupabaseUser | null
  pageTitle?: string
}

export function TopNavbar({ user, pageTitle = "CoderPush Leaves" }: TopNavbarProps) {
  const [userProfile, setUserProfile] = useState<{ role: 'employee' | 'manager' | 'admin' } | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return
      
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching user profile:', error)
          return
        }
        
        setUserProfile(data)
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [user?.id])
  return (
    <header className="border-b bg-background px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{pageTitle}</span>
        </div>

        <div className="flex items-center gap-3">
          <UserDropdownMenu user={user} userProfile={userProfile} />
        </div>
      </div>
    </header>
  )
}
