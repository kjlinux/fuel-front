<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    @click.self="closeDialog"
  >
    <Card class="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>{{ isEditing ? 'Modifier la station' : 'Nouvelle station' }}</CardTitle>
            <CardDescription>
              {{ isEditing ? 'Modifiez les informations de la station' : 'Ajoutez une nouvelle station-service' }}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" @click="closeDialog">
            <X class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-6">
           Station Information 
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-foreground">Informations générales</h3>
            
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">
                  Nom de la station *
                </label>
                <Input
                  v-model="formData.name"
                  placeholder="Station Total Dakar"
                  required
                />
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">
                  Responsable *
                </label>
                <Input
                  v-model="formData.manager"
                  placeholder="Amadou Diallo"
                  required
                />
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground">
                Adresse *
              </label>
              <Input
                v-model="formData.address"
                placeholder="Avenue Cheikh Anta Diop, Dakar"
                required
              />
            </div>
            
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">
                  Téléphone *
                </label>
                <Input
                  v-model="formData.phone"
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  required
                />
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  v-model="formData.email"
                  type="email"
                  placeholder="station@example.com"
                />
              </div>
            </div>
          </div>

           Location 
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-foreground">Localisation GPS</h3>
            
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">
                  Latitude *
                </label>
                <Input
                  v-model.number="formData.location.lat"
                  type="number"
                  step="0.000001"
                  placeholder="14.6937"
                  required
                />
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">
                  Longitude *
                </label>
                <Input
                  v-model.number="formData.location.lng"
                  type="number"
                  step="0.000001"
                  placeholder="-17.4441"
                  required
                />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" @click="closeDialog">
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              {{ isEditing ? 'Enregistrer' : 'Ajouter' }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { X } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  station: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:open', 'save'])

const isEditing = computed(() => !!props.station)

const formData = ref({
  name: '',
  manager: '',
  address: '',
  phone: '',
  email: '',
  location: {
    lat: 0,
    lng: 0
  }
})

watch(() => props.station, (newStation) => {
  if (newStation) {
    formData.value = {
      name: newStation.name || '',
      manager: newStation.manager || '',
      address: newStation.address || '',
      phone: newStation.phone || '',
      email: newStation.email || '',
      location: {
        lat: newStation.location?.lat || 0,
        lng: newStation.location?.lng || 0
      }
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.value = {
    name: '',
    manager: '',
    address: '',
    phone: '',
    email: '',
    location: {
      lat: 0,
      lng: 0
    }
  }
}

function closeDialog() {
  emit('update:open', false)
  setTimeout(resetForm, 300)
}

function handleSubmit() {
  emit('save', { ...formData.value })
  closeDialog()
}
</script>
