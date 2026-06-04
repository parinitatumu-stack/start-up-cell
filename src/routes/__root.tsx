import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Startup Cell — Student Innovation & Startup Cell Portal" },
      { name: "description", content: "Where ideas become ventures. One platform for student founders to register startups, connect mentors, track milestones, and walk into any pitch — completely ready." },
      { property: "og:title", content: "Startup Cell — Student Innovation & Startup Cell Portal" },
      { name: "twitter:title", content: "Startup Cell — Student Innovation & Startup Cell Portal" },
      { property: "og:description", content: "Where ideas become ventures. One platform for student founders to register startups, connect mentors, track milestones, and walk into any pitch — completely ready." },
      { name: "twitter:description", content: "Where ideas become ventures. One platform for student founders to register startups, connect mentors, track milestones, and walk into any pitch — completely ready." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6bb99136-829c-4364-9cd3-91cf0f220ee2/id-preview-290aba95--cb5eb9ad-f024-47c2-b55a-c875898ae32e.lovable.app-1780557363063.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6bb99136-829c-4364-9cd3-91cf0f220ee2/id-preview-290aba95--cb5eb9ad-f024-47c2-b55a-c875898ae32e.lovable.app-1780557363063.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <p className="eyebrow">404</p>
        <h1 className="font-display text-5xl mt-2">Page not found.</h1>
        <a href="/" className="mt-6 inline-block text-aqua underline">Return home</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
