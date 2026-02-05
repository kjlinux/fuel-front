import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { usersApi } from "@/services/api"

export const useUsersStore = defineStore("users", () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  })

  // Computed
  const activeUsers = computed(() => users.value.filter((u) => u.isActive))
  const adminUsers = computed(() =>
    users.value.filter((u) => ["super_admin", "admin"].includes(u.role))
  )
  const managerUsers = computed(() =>
    users.value.filter((u) => u.role === "manager")
  )

  // Fetch users with optional filters
  async function fetchUsers(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await usersApi.getAll(params)
      users.value = response.data.map(transformUser)

      if (response.meta) {
        pagination.value = {
          currentPage: response.meta.current_page,
          lastPage: response.meta.last_page,
          total: response.meta.total,
          perPage: response.meta.per_page,
        }
      }

      return users.value
    } catch (err) {
      error.value = err.message
      console.error("Failed to fetch users:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get single user
  async function fetchUser(id) {
    loading.value = true
    try {
      const response = await usersApi.getOne(id)
      return transformUser(response.data)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create user
  async function createUser(userData) {
    loading.value = true
    try {
      const response = await usersApi.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        is_active: userData.isActive !== false,
      })
      const newUser = transformUser(response.data)
      users.value.unshift(newUser)
      return newUser
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update user
  async function updateUser(userId, updates) {
    try {
      const payload = {
        name: updates.name,
        email: updates.email,
        role: updates.role,
        is_active: updates.isActive,
      }

      // Only include password if it's being changed
      if (updates.password) {
        payload.password = updates.password
      }

      const response = await usersApi.update(userId, payload)
      const updatedUser = transformUser(response.data)

      const index = users.value.findIndex((u) => u.id === userId)
      if (index !== -1) {
        users.value[index] = updatedUser
      }

      return updatedUser
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Delete user
  async function deleteUser(userId) {
    try {
      await usersApi.delete(userId)
      users.value = users.value.filter((u) => u.id !== userId)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Transform API response to frontend format
  function transformUser(apiUser) {
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role,
      isActive: apiUser.is_active,
      emailVerifiedAt: apiUser.email_verified_at
        ? new Date(apiUser.email_verified_at)
        : null,
      createdAt: new Date(apiUser.created_at),
      updatedAt: new Date(apiUser.updated_at),
      stations: apiUser.stations || [],
    }
  }

  // Get role label in French
  function getRoleLabel(role) {
    const labels = {
      super_admin: "Super Administrateur",
      admin: "Administrateur",
      manager: "Gestionnaire",
    }
    return labels[role] || role
  }

  return {
    users,
    loading,
    error,
    pagination,
    activeUsers,
    adminUsers,
    managerUsers,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    getRoleLabel,
  }
})
