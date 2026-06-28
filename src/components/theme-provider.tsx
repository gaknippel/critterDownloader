import { createContext, useContext, useEffect, useState } from "react"
import { Store } from "@tauri-apps/plugin-store"

type Theme = "dark" | "light" | "system" | "midnight" | "forest" | "sunset"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  // Load theme from Tauri Store on mount to overwrite localStorage if present
  useEffect(() => {
    const loadThemeFromStore = async () => {
      try {
        const store = await Store.load("settings.json")
        const savedTheme = await store.get<Theme>("theme")
        if (savedTheme) {
          setThemeState(savedTheme)
          localStorage.setItem(storageKey, savedTheme)
        }
      } catch (error) {
        console.error("Failed to load theme from Tauri store:", error)
      }
    }
    loadThemeFromStore()
  }, [storageKey])

  // Apply theme to document element
  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark", "midnight", "forest", "sunset")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setThemeState(theme)
      
      // Save theme to Tauri Store asynchronously
      const saveThemeToStore = async () => {
        try {
          const store = await Store.load("settings.json")
          await store.set("theme", theme)
          await store.save()
        } catch (error) {
          console.error("Failed to save theme to Tauri store:", error)
        }
      }
      saveThemeToStore()
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}