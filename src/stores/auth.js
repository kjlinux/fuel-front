import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { authApi } from "@/services/api"

export const useAuthStore = defineStore("auth", () => {
  const user = ref(JSON.parse(localStorage.getItem("user")) || null)
  const token = ref(localStorage.getItem("token") || null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)
  const isAdmin = computed(() => ["super_admin", "admin"].includes(userRole.value))
  const isSuperAdmin = computed(() => userRole.value === "super_admin")

  async function login(email, password) {
    loading.value = true
    try {
      const response = await authApi.login(email, password)

      token.value = response.token
      user.value = response.user
      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message || "Identifiants incorrects",
      }
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    try {
      const response = await authApi.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.confirmPassword,
      })

      token.value = response.token
      user.value = response.user
      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message || "Échec de l'inscription",
        errors: error.errors || {},
      }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  }

  async function fetchUser() {
    if (!token.value) return

    loading.value = true
    try {
      const response = await authApi.me()
      user.value = response.data
      localStorage.setItem("user", JSON.stringify(response.data))
    } catch (error) {
      console.error("Failed to fetch user:", error)
      // Token invalid, logout
      await logout()
    } finally {
      loading.value = false
    }
  }

  // Check if user has specific role
  function hasRole(roles) {
    if (!userRole.value) return false
    if (typeof roles === "string") return userRole.value === roles
    return roles.includes(userRole.value)
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    userRole,
    isAdmin,
    isSuperAdmin,
    login,
    register,
    logout,
    fetchUser,
    hasRole,
  }
})
