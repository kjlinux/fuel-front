<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 mb-4">
          <Droplet class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-3xl font-bold text-foreground mb-2">FuelTrack</h1>
        <p class="text-muted-foreground">Créez votre compte</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inscription</CardTitle>
          <CardDescription>Créez un compte pour votre station</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div class="space-y-2">
              <label for="stationName" class="text-sm font-medium text-foreground">
                Nom de la station
              </label>
              <Input
                id="stationName"
                v-model="formData.stationName"
                placeholder="Station Total Dakar"
                required
              />
            </div>

            <div class="space-y-2">
              <label for="name" class="text-sm font-medium text-foreground">
                Nom complet
              </label>
              <Input
                id="name"
                v-model="formData.name"
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div class="space-y-2">
              <label for="email" class="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                v-model="formData.email"
                type="email"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div class="space-y-2">
              <label for="phone" class="text-sm font-medium text-foreground">
                Téléphone
              </label>
              <Input
                id="phone"
                v-model="formData.phone"
                type="tel"
                placeholder="+221 XX XXX XX XX"
                required
              />
            </div>

            <div class="space-y-2">
              <label for="password" class="text-sm font-medium text-foreground">
                Mot de passe
              </label>
              <Input
                id="password"
                v-model="formData.password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div class="space-y-2">
              <label for="confirmPassword" class="text-sm font-medium text-foreground">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div v-if="error" class="text-sm text-destructive">
              {{ error }}
            </div>

            <Button
              type="submit"
              variant="primary"
              class="w-full"
              :disabled="loading"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <span v-else>Créer mon compte</span>
            </Button>
          </form>

          <div class="mt-4 text-center text-sm">
            <span class="text-muted-foreground">Déjà un compte ?</span>
            <router-link
              to="/login"
              class="text-primary hover:underline ml-1"
            >
              Se connecter
            </router-link>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Droplet, Loader2 } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const router = useRouter()
const authStore = useAuthStore()

const formData = ref({
  stationName: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')

async function handleRegister() {
  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  loading.value = true
  error.value = ''

  const result = await authStore.register(formData.value)

  if (result.success) {
    router.push({ name: 'dashboard' })
  } else {
    error.value = result.error || 'Échec de l\'inscription'
  }

  loading.value = false
}
</script>
