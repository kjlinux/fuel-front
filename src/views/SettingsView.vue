<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Paramètres</h1>
      <p class="text-muted-foreground mt-1">Configurez votre plateforme et vos préférences</p>
    </div>

    <div class="grid gap-6">
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">Profil</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">Nom</label>
              <input
                v-model="profile.name"
                type="text"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                v-model="profile.email"
                type="email"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <button class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
            Enregistrer les modifications
          </button>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">Notifications</h2>
        <div class="space-y-4">
          <label class="flex items-center justify-between p-4 bg-background rounded-lg cursor-pointer">
            <div>
              <div class="font-medium text-foreground">Alertes par email</div>
              <div class="text-sm text-muted-foreground">Recevoir les alertes critiques par email</div>
            </div>
            <input
              v-model="notifications.email"
              type="checkbox"
              class="w-5 h-5 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
            />
          </label>
          <label class="flex items-center justify-between p-4 bg-background rounded-lg cursor-pointer">
            <div>
              <div class="font-medium text-foreground">Notifications push</div>
              <div class="text-sm text-muted-foreground">Recevoir les notifications dans le navigateur</div>
            </div>
            <input
              v-model="notifications.push"
              type="checkbox"
              class="w-5 h-5 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
            />
          </label>
          <label class="flex items-center justify-between p-4 bg-background rounded-lg cursor-pointer">
            <div>
              <div class="font-medium text-foreground">Rapports hebdomadaires</div>
              <div class="text-sm text-muted-foreground">Recevoir un résumé hebdomadaire par email</div>
            </div>
            <input
              v-model="notifications.weekly"
              type="checkbox"
              class="w-5 h-5 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">Configuration MQTT</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">URL du Broker</label>
            <input
              v-model="mqtt.brokerUrl"
              type="text"
              class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ws://localhost:9001"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">Nom d'utilisateur</label>
              <input
                v-model="mqtt.username"
                type="text"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">Mot de passe</label>
              <input
                v-model="mqtt.password"
                type="password"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
              Tester la connexion
            </button>
            <div class="flex items-center gap-2 text-sm">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              <span class="text-muted-foreground">Connecté</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">Système</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">Langue</label>
            <select
              v-model="system.language"
              class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">Fuseau horaire</label>
            <select
              v-model="system.timezone"
              class="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
              <option value="Europe/London">Europe/London (GMT+0)</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
            </select>
          </div>
          <label class="flex items-center justify-between p-4 bg-background rounded-lg cursor-pointer">
            <div>
              <div class="font-medium text-foreground">Mode sombre</div>
              <div class="text-sm text-muted-foreground">Utiliser le thème sombre</div>
            </div>
            <input
              v-model="system.darkMode"
              type="checkbox"
              class="w-5 h-5 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const profile = ref({
  name: 'Admin User',
  email: 'admin@fueliot.com'
})

const notifications = ref({
  email: true,
  push: true,
  weekly: false
})

const mqtt = ref({
  brokerUrl: 'ws://localhost:9001',
  username: '',
  password: ''
})

const system = ref({
  language: 'fr',
  timezone: 'Europe/Paris',
  darkMode: true
})
</script>
