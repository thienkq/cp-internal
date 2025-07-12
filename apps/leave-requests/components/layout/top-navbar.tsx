"use client"
import { UserDropdownMenu } from "@/components/user-dropdown-menu"
import { type User as SupabaseUser } from "@workspace/supabase"

interface TopNavbarProps {
  user?: SupabaseUser | null
  pageTitle?: string
}

export function TopNavbar({ user, pageTitle = "CoderPush Leaves" }: TopNavbarProps) {
  return (
    <header className="border-b bg-white px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{pageTitle}</span>
        </div>

        <div className="flex items-center gap-3">
          <UserDropdownMenu user={user} />
        </div>
      </div>
    </header>
  )
}
