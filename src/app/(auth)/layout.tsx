import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-6 py-12">
      <div className="w-full max-w-md apple-card p-10">
        {children}
      </div>
    </div>
  );
}

