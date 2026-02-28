import { useTheme } from '../hooks/useTheme'

export function ThemeExample() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Theme Testing Example</h1>
          <p className="text-muted-foreground">
            Test theme switching functionality by changing the defaultTheme in main.jsx
          </p>
        </div>

        {/* Theme Status Card */}
        <div className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Current Theme Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="font-medium">Theme Preference:</span>
              <span className="px-3 py-1 bg-primary text-primary-foreground rounded-md">
                {theme}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium">Resolved Theme:</span>
              <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md">
                {resolvedTheme}
              </span>
            </div>
          </div>
        </div>

        {/* Theme Control Buttons */}
        <div className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Theme Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                theme === 'system'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              System
            </button>
          </div>
        </div>

        {/* Visual Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Example */}
          <div className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Card Example</h3>
            <p className="text-muted-foreground">
              This card demonstrates how the theme affects card backgrounds and text colors.
            </p>
          </div>

          {/* Accent Example */}
          <div className="bg-accent text-accent-foreground border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Accent Example</h3>
            <p className="opacity-80">
              This card uses accent colors to show theme variations.
            </p>
          </div>

          {/* Muted Example */}
          <div className="bg-muted text-muted-foreground border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Muted Example</h3>
            <p>
              This card uses muted colors for subtle backgrounds.
            </p>
          </div>

          {/* Primary Example */}
          <div className="bg-primary text-primary-foreground border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Primary Example</h3>
            <p>
              This card uses primary colors for emphasis.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-muted text-muted-foreground border border-border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open <code className="bg-background px-2 py-1 rounded">main.jsx</code></li>
            <li>Change the <code className="bg-background px-2 py-1 rounded">defaultTheme</code> prop to "light", "dark", or "system"</li>
            <li>Refresh the page to see the default theme applied</li>
            <li>Use the buttons above to switch themes dynamically</li>
            <li>Check localStorage to see the theme preference is persisted</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

