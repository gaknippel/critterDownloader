import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
            <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to YouTube Downloader
        </h1>
        <p className="text-muted-foreground">
          Download your favorite videos and audio from YouTube
        </p>
      </div>
    </div>
      </main>
    </SidebarProvider>
    </ThemeProvider>
    </div>
  )
}