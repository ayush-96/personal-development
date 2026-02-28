import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import router from './routes'
import { ThemeProvider } from './contexts/ThemeContext'
import { UserProvider } from './contexts/UserContext'
import { SpaceProvider } from './contexts/SpaceContext'
import { QuizProvider } from './contexts/QuizContext'

createRoot(document.getElementById('root')).render(
  <ThemeProvider defaultTheme="system" storageKey="theme">
    <UserProvider>
      <SpaceProvider>
        <QuizProvider>
          <RouterProvider router={router} />
        </QuizProvider>
      </SpaceProvider>
    </UserProvider>
  </ThemeProvider>
)