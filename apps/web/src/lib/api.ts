import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Since we use HTTP-only cookies, we don't need to manually inject a Bearer token.
// The browser handles sending the cookie for every request automatically because of withCredentials: true.

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // If we receive a 401 Unauthorized, dispatch a custom event so the AuthContext can log the user out
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)
