import api from './api'

export interface User {
  id: string
  email: string
  username: string
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export const authService = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  async register(userData: RegisterRequest): Promise<User> {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me')
    return response.data
  },

  logout() {
    localStorage.removeItem('access_token')
  },
}

