<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between p-6 border-b border-border">
        <h2 class="text-xl font-bold text-foreground">
          {{ user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}
        </h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

       Form 
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
         Personal Info 
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-foreground">Informations personnelles</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">Nom complet</label>
              <input
                v-model="formData.name"
                type="text"
                required
                class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Jean Dupont"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                v-model="formData.email"
                type="email"
                required
                class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="jean.dupont@example.com"
              />
            </div>
          </div>

          <div v-if="!user" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">Mot de passe</label>
              <input
                v-model="formData.password"
                type="password"
                :required="!user"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">Confirmer le mot de passe</label>
              <input
                v-model="formData.confirmPassword"
                type="password"
                :required="!user"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

         Role & Permissions 
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-foreground">Rôle et permissions</h3>
          
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">Rôle</label>
            <select
              v-model="formData.role"
              required
              class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner un rôle</option>
              <option value="super_admin">Super Admin - Accès complet à toutes les stations</option>
              <option value="admin">Admin Station - Gestion complète d'une station</option>
              <option value="manager">Manager - Consultation et rapports uniquement</option>
            </select>
          </div>

          <div v-if="formData.role !== 'super_admin'">
            <label class="block text-sm font-medium text-foreground mb-2">Stations assignées</label>
            <div class="space-y-2 max-h-48 overflow-y-auto p-4 bg-background border border-border rounded-lg">
              <label
                v-for="station in availableStations"
                :key="station.id"
                class="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="station.id"
                  v-model="formData.stations"
                  class="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                />
                <span class="text-sm text-foreground">{{ station.name }}</span>
              </label>
            </div>
          </div>
        </div>

         Actions 
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            {{ user ? 'Enregistrer' : 'Créer l\'utilisateur' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  stations: []
})

// Mock stations
const availableStations = ref([
  { id: 1, name: 'Station Total - Paris 15ème' },
  { id: 2, name: 'Station Shell - Lyon Centre' },
  { id: 3, name: 'Station BP - Marseille Nord' },
  { id: 4, name: 'Station Esso - Toulouse Sud' }
])

// Initialize form with user data if editing
watch(() => props.user, (newUser) => {
  if (newUser) {
    formData.value = {
      name: newUser.name,
      email: newUser.email,
      password: '',
      confirmPassword: '',
      role: newUser.role,
      stations: [...newUser.stations]
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  if (!props.user && formData.value.password !== formData.value.confirmPassword) {
    alert('Les mots de passe ne correspondent pas')
    return
  }

  if (formData.value.role !== 'super_admin' && formData.value.stations.length === 0) {
    alert('Veuillez sélectionner au moins une station')
    return
  }

  const userData = {
    name: formData.value.name,
    email: formData.value.email,
    role: formData.value.role,
    stations: formData.value.role === 'super_admin' ? availableStations.value.map(s => s.id) : formData.value.stations
  }

  emit('save', userData)
}
</script>
