import React from "react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex">
      <aside className="w-64 bg-gray-100 border-r p-6 hidden md:block">
        <div className="font-bold text-lg mb-4">Dashboard</div>
        {/* Add navigation links here */}
        <nav className="flex flex-col gap-2 text-sm text-gray-700">
          <span className="text-gray-400">(Sidebar nav here)</span>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
