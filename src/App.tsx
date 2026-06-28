import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import UpdateChecker from './components/UpdateChecker'
import { TitleBar } from './components/TitleBar'
import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className='select-none h-screen flex flex-col overflow-hidden bg-background text-foreground'>
        <TitleBar />
        <UpdateChecker />
        <Toaster />
        <div className="fixed select-none top-14 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border z-40">
          v{version}
        </div>
        <SidebarProvider className="flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex flex-col overflow-hidden">
            <div className="p-3 shrink-0 flex items-center">
              <SidebarTrigger />
            </div>
            <div className="flex-1 overflow-auto">
              <Outlet />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ThemeProvider>
  )
}
