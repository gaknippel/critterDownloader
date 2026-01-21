// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import Home from "./pages/Home/Home"

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full">
            <SidebarTrigger />
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </main>
        </SidebarProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}