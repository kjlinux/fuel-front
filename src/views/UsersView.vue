<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Gestion des utilisateurs</h1>
        <p class="text-muted-foreground mt-1">Gérez les accès et permissions de votre équipe</p>
      </div>
      <button
        @click="openUserDialog()"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Ajouter un utilisateur
      </button>
    </div>

    <div class="flex gap-4">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un utilisateur..."
          class="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <select
        v-model="roleFilter"
        class="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Tous les rôles</option>
        <option value="super_admin">Super Admin</option>
        <option value="admin">Admin Station</option>
        <option value="manager">Manager</option>
      </select>
      <select
        v-model="statusFilter"
        class="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Tous les statuts</option>
        <option value="active">Actif</option>
        <option value="inactive">Inactif</option>
      </select>
    </div>

    <!-- Loading state -->
    <div v-if="usersStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="usersStore.error" class="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
      {{ usersStore.error }}
      <button @click="loadUsers" class="ml-2 underline">Réessayer</button>
    </div>

    <!-- Users table -->
    <div v-else class="bg-card border border-border rounded-lg overflow-hidden">
      <table class="w-full">
        <thead class="bg-muted/50 border-b border-border">
          <tr>
            <th class="text-left px-6 py-4 text-sm font-semibold text-foreground">Utilisateur</th>
            <th class="text-left px-6 py-4 text-sm font-semibold text-foreground">Rôle</th>
            <th class="text-left px-6 py-4 text-sm font-semibold text-foreground">Stations</th>
            <th class="text-left px-6 py-4 text-sm font-semibold text-foreground">Statut</th>
            <th class="text-left px-6 py-4 text-sm font-semibold text-foreground">Créé le</th>
            <th class="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-muted/30 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="font-medium text-foreground">{{ user.name }}</div>
                  <div class="text-sm text-muted-foreground">{{ user.email }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                :class="{
                  'bg-purple-500/20 text-purple-400': user.role === 'super_admin',
                  'bg-blue-500/20 text-blue-400': user.role === 'admin',
                  'bg-green-500/20 text-green-400': user.role === 'manager'
                }"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
              >
                {{ usersStore.getRoleLabel(user.role) }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-foreground">
                {{ user.stations?.length || 0 }} station{{ (user.stations?.length || 0) > 1 ? 's' : '' }}
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                :class="{
                  'bg-green-500/20 text-green-400': user.isActive,
                  'bg-gray-500/20 text-gray-400': !user.isActive
                }"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ user.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-muted-foreground">
              {{ formatDate(user.createdAt) }}
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="openUserDialog(user)"
                  class="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  title="Modifier"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="toggleUserStatus(user)"
                  class="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  :title="user.isActive ? 'Désactiver' : 'Activer'"
                >
                  <svg v-if="user.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  @click="handleDeleteUser(user)"
                  class="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                  title="Supprimer"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-muted-foreground">
              Aucun utilisateur trouvé
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserDialog
      v-if="showUserDialog"
      :user="selectedUser"
      @close="showUserDialog = false"
      @save="handleSaveUser"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import UserDialog from '@/components/users/UserDialog.vue'

const usersStore = useUsersStore()

const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const showUserDialog = ref(false)
const selectedUser = ref(null)

// Load users on mount
onMounted(() => {
  loadUsers()
})

async function loadUsers() {
  try {
    await usersStore.fetchUsers()
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

const filteredUsers = computed(() => {
  return usersStore.users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesRole = !roleFilter.value || user.role === roleFilter.value
    const matchesStatus = !statusFilter.value ||
                         (statusFilter.value === 'active' && user.isActive) ||
                         (statusFilter.value === 'inactive' && !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })
})

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const openUserDialog = (user = null) => {
  selectedUser.value = user
  showUserDialog.value = true
}

const handleSaveUser = async (userData) => {
  try {
    if (selectedUser.value) {
      await usersStore.updateUser(selectedUser.value.id, userData)
    } else {
      await usersStore.createUser(userData)
    }
    showUserDialog.value = false
  } catch (error) {
    console.error('Failed to save user:', error)
    alert('Erreur lors de la sauvegarde: ' + error.message)
  }
}

const toggleUserStatus = async (user) => {
  try {
    await usersStore.updateUser(user.id, {
      ...user,
      isActive: !user.isActive
    })
  } catch (error) {
    console.error('Failed to toggle user status:', error)
    alert('Erreur: ' + error.message)
  }
}

const handleDeleteUser = async (user) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ?`)) {
    try {
      await usersStore.deleteUser(user.id)
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Erreur: ' + error.message)
    }
  }
}
</script>
