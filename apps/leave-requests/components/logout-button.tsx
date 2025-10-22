"use client";

import { signOut } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";

export function LogoutButton() {
  const logout = async () => {
    await signOut({
      redirectTo: "/auth/login",
    });
  };

  return <Button onClick={logout}>Logout</Button>;
}
