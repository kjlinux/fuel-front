<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    @click.self="closeDialog"
  >
    <Card class="w-full max-w-lg">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>{{ isEditing ? 'Modifier la cuve' : 'Nouvelle cuve' }}</CardTitle>
            <CardDescription>
              {{ isEditing ? 'Modifiez les paramètres de la cuve' : 'Ajoutez une nouvelle cuve de carburant' }}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" @click="closeDialog">
            <X class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">
              Nom de la cuve *
            </label>
            <Input
              v-model="formData.name"
              placeholder="Cuve Essence 1"
              required
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">
              Type de carburant *
            </label>
            <select
              v-model="formData.type"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Sélectionner...</option>
              <option value="essence">Essence</option>
              <option value="gasoil">Gasoil</option>
            </select>
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">
              Capacité (litres) *
            </label>
            <Input
              v-model.number="formData.capacity"
              type="number"
              min="1000"
              step="1000"
              placeholder="20000"
              required
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">
              ID du capteur *
            </label>
            <Input
              v-model="formData.sensorId"
              placeholder="SENSOR-001"
              required
            />
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
  tank: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:open', 'save'])

const isEditing = computed(() => !!props.tank)

const formData = ref({
  name: '',
  type: '',
  capacity: 20000,
  sensorId: ''
})

watch(() => props.tank, (newTank) => {
  if (newTank) {
    formData.value = {
      name: newTank.name || '',
      type: newTank.type || '',
      capacity: newTank.capacity || 20000,
      sensorId: newTank.sensorId || ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.value = {
    name: '',
    type: '',
    capacity: 20000,
    sensorId: ''
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
