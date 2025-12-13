import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [userEmail, setUserEmail] = useState(null)
  const [testId, setTestId] = useState(null)

  // Initialize from token and storage on mount
  useEffect(() => {
    try {
      // Try to get user email from localStorage (set by App.jsx) or token
      const storedEmail = localStorage.getItem('user_email')
      if (storedEmail) {
        setUserEmail(storedEmail)
      } else {
        // Fallback to extracting from token
        const email = getUserEmailFromToken()
        if (email) {
          setUserEmail(email)
          localStorage.setItem('user_email', email)
        }
      }

      // Try to get test ID from storage
      const storedTestId = localStorage.getItem('pending_test_id') || localStorage.getItem('test_id')
      if (storedTestId) {
        setTestId(storedTestId)
      }
    } catch (error) {
      console.error('Error initializing UserContext:', error)
      // Don't throw - allow app to continue
    }
  }, [])

  // Listen for storage events to update when test ID is set
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'test_id' && e.newValue) {
        setTestId(e.newValue)
      } else if (e.key === 'user_email' && e.newValue) {
        setUserEmail(e.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorage = () => {
      const storedTestId = localStorage.getItem('pending_test_id') || localStorage.getItem('test_id')
      if (storedTestId && storedTestId !== testId) {
        setTestId(storedTestId)
      }
      const storedEmail = localStorage.getItem('user_email')
      if (storedEmail && storedEmail !== userEmail) {
        setUserEmail(storedEmail)
      }
    }

    // Check periodically for updates (since storage events don't fire in same tab)
    const interval = setInterval(handleCustomStorage, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [testId, userEmail])

  const value = {
    userEmail,
    testId,
    setUserEmail,
    setTestId,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

/**
 * Decode JWT token to get user email
 * @returns {string|null} User email or null if not found
 */
function getUserEmailFromToken() {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return null
    }
    
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]))
    
    // Safely access payload properties - use optional chaining to avoid undefined errors
    // Don't access .profile or other properties that might not exist
    return payload?.email || payload?.sub || payload?.['cognito:username'] || null
  } catch (error) {
    console.error('Error decoding JWT token:', error)
    return null
  }
}

