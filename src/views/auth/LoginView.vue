<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 mb-4">
          <Droplet class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-3xl font-bold text-foreground mb-2">FuelTrack</h1>
        <p class="text-muted-foreground">Plateforme IoT de Suivi Carburant</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Connectez-vous à votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="space-y-2">
              <label for="email" class="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div class="space-y-2">
              <label for="password" class="text-sm font-medium text-foreground">
                Mot de passe
              </label>
              <Input
                id="password"
                v-model="password"
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
              <span v-else>Se connecter</span>
            </Button>
          </form>

          <div class="mt-4 text-center text-sm">
            <span class="text-muted-foreground">Pas encore de compte ?</span>
            <router-link
              to="/register"
              class="text-primary hover:underline ml-1"
            >
              S'inscrire
            </router-link>
          </div>
        </CardContent>
      </Card>

      <p class="text-center text-xs text-muted-foreground mt-8">
        © 2025 FuelTrack. Tous droits réservés.
      </p>
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

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    router.push({ name: 'dashboard' })
  } else {
    error.value = result.error || 'Échec de la connexion'
  }

  loading.value = false
}
</script>
