import { useTheme as useThemeContext } from '../contexts/ThemeContext'

/**
 * Hook to access theme state and controls
 * @returns {Object} Theme state and controls
 * @returns {string} returns.theme - Current theme preference ('light' | 'dark' | 'system')
 * @returns {string} returns.resolvedTheme - Actual theme being applied ('light' | 'dark')
 * @returns {Function} returns.setTheme - Function to change theme preference
 */
export function useTheme() {
  return useThemeContext()
}

