import { useState, useEffect } from 'react'
import { authService, User } from '../services/authService'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authService
        .getCurrentUser()
        .then((userData) => {
          setUser(userData)
          setIsAuthenticated(true)
          setIsLoading(false)
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          setIsAuthenticated(false)
          setIsLoading(false)
        })
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    localStorage.setItem('access_token', response.access_token)
    // Set authenticated immediately after token is stored
    setIsAuthenticated(true)
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      // If getCurrentUser fails, we're still authenticated (token is valid)
      // User data will be fetched on next app load
      console.warn('Failed to fetch user data after login:', error)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
  }
}

