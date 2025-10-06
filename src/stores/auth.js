import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null)
  const token = ref(localStorage.getItem("token") || null)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)

  async function login(email, password) {
    try {
      // Simulate API call - Replace with actual API
      // Mock successful login
      const mockUser = {
        id: 1,
        name: "Admin User",
        email: email,
        role: "super_admin",
      }
      const mockToken = "mock-jwt-token-" + Date.now()

      token.value = mockToken
      user.value = mockUser
      localStorage.setItem("token", mockToken)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function register(userData) {
    try {
      // Simulate API call - Replace with actual API
      const mockUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        role: "admin",
      }
      const mockToken = "mock-jwt-token-" + Date.now()

      token.value = mockToken
      user.value = mockUser
      localStorage.setItem("token", mockToken)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem("token")
  }

  async function fetchUser() {
    if (!token.value) return

    try {
      // Simulate API call - Replace with actual API
      user.value = {
        id: 1,
        name: "Admin User",
        email: "admin@fueliot.com",
        role: "super_admin",
      }
    } catch (error) {
      logout()
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    userRole,
    login,
    register,
    logout,
    fetchUser,
  }
})
