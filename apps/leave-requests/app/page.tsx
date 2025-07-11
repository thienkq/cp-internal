import { AuthButton } from "@/components/auth-button";
import { Card, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { FileText, Activity, Book } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cardColors, getCardStyle } from "@/lib/utils";

const cardData: { title: string; Icon: LucideIcon }[] = [
  { title: "Leave Request", Icon: FileText },
  { title: "Pulse", Icon: Activity },
  { title: "Docs", Icon: Book },
];

export default function Page() {
  return (
    <div className="min-h-svh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-sm shadow-sm">
        <span className="text-2xl font-bold text-foreground">CoderPush</span>
        <AuthButton />
      </header>
      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-10 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
          CoderPush Internal Tools
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Your central hub for internal tools at CoderPush.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          {cardData.map(({ title, Icon }, index) => (
            <Card
              key={title}
              className={cn(
                "group rounded-xl p-6 transition-all duration-200 ease-in-out hover:-translate-y-2 cursor-pointer flex flex-col items-center justify-center",
                getCardStyle(cardColors[index % cardColors.length] ?? "green")
              )}
            >
              <CardHeader className="flex flex-col items-center gap-4">
                <Icon className="size-16 transition-transform duration-200 group-hover:scale-110" />
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
