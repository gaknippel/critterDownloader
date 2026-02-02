import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import UpdateChecker from './components/UpdateChecker'
import {getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';



export default function App() {

  const [version, setVersion] = useState('');


  useEffect(() => {
    getVersion().then(setVersion);
  },[]);

  return (
    <div className='select-none'>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <UpdateChecker />
      <div className="fixed select-none top-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border z-40">
        v{version}
      </div>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SidebarTrigger />
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
    </ThemeProvider>
    </div>
    
  )
}