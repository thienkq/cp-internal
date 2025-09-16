import React from "react";

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto px-4 py-8 w-full bg-background">
      {children}
    </div>
  );
} 