import { AuthButton } from "@/components/auth-button"
import { Card, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { FileText, Activity, Book } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const cardData: { title: string; Icon: LucideIcon }[] = [
  { title: "Leave Request", Icon: FileText },
  { title: "Pulse", Icon: Activity },
  { title: "Docs", Icon: Book },
]

export default function Page() {
  return (
    <div className="min-h-svh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b">
        <span className="text-lg font-semibold">CoderPush</span>
        <AuthButton />
      </header>
      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8">
        <h1 className="text-3xl font-bold">Welcome to CoderPush</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          {cardData.map(({ title, Icon }) => (
            <Card
              key={title}
              className="items-center text-center border transition-transform duration-200 hover:shadow-lg hover:scale-105 cursor-pointer p-3 rounded-lg"
            >
              <CardHeader className="flex flex-col items-center gap-2">
                <Icon className="size-10 text-primary mb-2" />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
