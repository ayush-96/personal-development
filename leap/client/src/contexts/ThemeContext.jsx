import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(undefined)

function getInitialTheme(defaultTheme, storageKey) {
  if (typeof window === 'undefined') return defaultTheme
  
  const stored = localStorage.getItem(storageKey)
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored
  }
  return defaultTheme
}

function getResolvedTheme(theme) {
  if (typeof window === 'undefined') return 'light'
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

if (typeof window !== 'undefined') {
  const initialTheme = getInitialTheme('system', 'theme')
  const initialResolvedTheme = getResolvedTheme(initialTheme)
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(initialResolvedTheme)
}

export function ThemeProvider({ children, defaultTheme = 'system', storageKey = 'theme' }) {
  const [theme, setTheme] = useState(() => getInitialTheme(defaultTheme, storageKey))
  const [resolvedTheme, setResolvedTheme] = useState(() => getResolvedTheme(theme))

  useEffect(() => {
    const root = document.documentElement
    
    root.classList.remove('light', 'dark')
    
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (theme !== 'system') {
      setResolvedTheme(theme)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      setResolvedTheme(e.matches ? 'dark' : 'light')
    }

    setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    } else {
      mediaQuery.addListener(handleChange)
      return () => {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme) => {
      if (newTheme && ['light', 'dark', 'system'].includes(newTheme)) {
        localStorage.setItem(storageKey, newTheme)
        setTheme(newTheme)
      }
    },
    resolvedTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

