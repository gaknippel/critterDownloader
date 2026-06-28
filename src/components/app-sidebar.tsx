import { Download, File, Home, Settings, Github } from "lucide-react"
import { Link } from "react-router-dom"  // ← Add this import

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Download",
    url: "/download",
    icon: Download,
  },
  {
    title: "About",
    url: "/about",
    icon: File, 
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },

]

export function AppSidebar() {
  return (
    <Sidebar className="pt-10">
      <SidebarContent>
        <SidebarGroup className="py-4">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg" className="px-4 py-6 rounded-lg transition-all duration-200">
                    <Link to={item.url} className="flex items-center gap-3.5">
                      <item.icon className="!size-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                      <span className="text-base font-semibold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar-accent/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="px-4 py-6 rounded-lg transition-all duration-200">
              <a href="https://github.com/gaknippel/critterDownloader" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                <Github className="!size-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                <span className="text-sm font-semibold">view source code!</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>  )
}