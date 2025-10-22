import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { auth } from "@/auth";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const session = await auth();

  return session?.user ? (
    <div className="flex items-center gap-4">
      Hey, {session.user.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
    </div>
  );
}
