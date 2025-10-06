# Guide d'Intégration MQTT

Ce document explique comment intégrer et configurer la communication MQTT pour la plateforme FuelIoT.

## Architecture MQTT

### Broker MQTT

La plateforme nécessite un broker MQTT pour la communication temps réel avec les capteurs IoT. Options recommandées :

1. **Eclipse Mosquitto** (Open Source)
   - Installation locale facile
   - Léger et performant
   - Configuration simple

2. **HiveMQ** (Cloud/Self-hosted)
   - Interface d'administration
   - Scalabilité élevée
   - Support commercial

3. **EMQX** (Open Source/Enterprise)
   - Haute disponibilité
   - Clustering natif
   - Dashboard intégré

### Installation de Mosquitto (Exemple)

#### Linux/Ubuntu
\`\`\`bash
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
\`\`\`

#### macOS
\`\`\`bash
brew install mosquitto
brew services start mosquitto
\`\`\`

#### Docker
\`\`\`bash
docker run -d --name mosquitto -p 1883:1883 -p 9001:9001 eclipse-mosquitto
\`\`\`

### Configuration WebSocket

Pour permettre la connexion depuis le navigateur, activez WebSocket dans Mosquitto :

**Fichier : /etc/mosquitto/mosquitto.conf**
\`\`\`conf
# Port MQTT standard
listener 1883
protocol mqtt

# Port WebSocket pour navigateurs
listener 9001
protocol websockets

# Autoriser les connexions anonymes (dev uniquement)
allow_anonymous true

# En production, utilisez l'authentification
# password_file /etc/mosquitto/passwd
\`\`\`

Redémarrer Mosquitto :
\`\`\`bash
sudo systemctl restart mosquitto
\`\`\`

## Topics MQTT

### Structure des Topics

La plateforme utilise une structure hiérarchique pour les topics :

\`\`\`
fueliot/
├── station/{stationId}/
│   ├── tank/{tankId}/
│   │   ├── level          # Niveau de carburant
│   │   ├── temperature    # Température
│   │   └── alert          # Alertes spécifiques à la cuve
│   ├── status             # Statut général de la station
│   └── connection         # État de connexion
\`\`\`

### Topics de Publication (Capteurs → Plateforme)

#### 1. Niveau de Carburant
**Topic :** \`fueliot/station/{stationId}/tank/{tankId}/level\`

**Payload :**
\`\`\`json
{
  "tankId": "tank-1",
  "stationId": "station-1",
  "fuelType": "essence",
  "level": 8500,
  "capacity": 10000,
  "percentage": 85.0,
  "unit": "liters",
  "timestamp": "2025-01-10T14:30:00Z"
}
\`\`\`

**Fréquence :** Toutes les 30 secondes ou sur changement significatif (>1%)

#### 2. Température
**Topic :** \`fueliot/station/{stationId}/tank/{tankId}/temperature\`

**Payload :**
\`\`\`json
{
  "tankId": "tank-1",
  "stationId": "station-1",
  "temperature": 22.5,
  "unit": "celsius",
  "timestamp": "2025-01-10T14:30:00Z"
}
\`\`\`

**Fréquence :** Toutes les 5 minutes

#### 3. Alertes
**Topic :** \`fueliot/station/{stationId}/tank/{tankId}/alert\`

**Payload :**
\`\`\`json
{
  "alertId": "alert-12345",
  "type": "low_level",
  "severity": "warning",
  "tankId": "tank-1",
  "stationId": "station-1",
  "message": "Niveau de carburant bas : 15%",
  "currentLevel": 1500,
  "threshold": 2000,
  "timestamp": "2025-01-10T14:30:00Z"
}
\`\`\`

**Types d'alertes :**
- \`low_level\` - Niveau bas
- \`critical_level\` - Niveau critique
- \`leak_detected\` - Fuite détectée
- \`abnormal_drop\` - Baisse anormale (vol potentiel)
- \`sensor_error\` - Erreur capteur
- \`high_temperature\` - Température élevée

**Niveaux de sévérité :**
- \`info\` - Information
- \`warning\` - Avertissement
- \`error\` - Erreur
- \`critical\` - Critique

#### 4. Statut de Station
**Topic :** \`fueliot/station/{stationId}/status\`

**Payload :**
\`\`\`json
{
  "stationId": "station-1",
  "status": "online",
  "tanksCount": 4,
  "activeTanks": 4,
  "totalCapacity": 40000,
  "totalLevel": 32500,
  "lastUpdate": "2025-01-10T14:30:00Z"
}
\`\`\`

**Statuts possibles :**
- \`online\` - En ligne
- \`offline\` - Hors ligne
- \`maintenance\` - En maintenance
- \`error\` - Erreur

### Topics de Souscription (Plateforme → Capteurs)

#### 1. Commandes
**Topic :** \`fueliot/station/{stationId}/command\`

**Payload :**
\`\`\`json
{
  "command": "calibrate",
  "tankId": "tank-1",
  "parameters": {
    "offset": 0
  },
  "timestamp": "2025-01-10T14:30:00Z"
}
\`\`\`

**Commandes disponibles :**
- \`calibrate\` - Calibrer le capteur
- \`reset\` - Réinitialiser
- \`update_interval\` - Modifier la fréquence de mise à jour

## Configuration Frontend

### Variables d'Environnement

Créer un fichier \`.env\` :

\`\`\`env
# MQTT Broker Configuration
VITE_MQTT_BROKER_URL=ws://localhost:9001
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=
VITE_MQTT_CLIENT_ID=fueliot-web-client

# Options de connexion
VITE_MQTT_RECONNECT_PERIOD=5000
VITE_MQTT_CONNECT_TIMEOUT=30000
VITE_MQTT_KEEPALIVE=60
\`\`\`

### Service MQTT

Le service MQTT est déjà configuré dans \`src/services/mqttService.js\`. Il gère :

- Connexion/Déconnexion automatique
- Reconnexion automatique en cas de perte
- Souscription aux topics
- Gestion des messages entrants
- Émission d'événements pour les composants Vue

### Utilisation dans les Composants

\`\`\`vue
<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useMqttService } from '@/composables/useMqtt'

const mqtt = useMqttService()

onMounted(() => {
  // S'abonner aux mises à jour de niveau
  mqtt.on('level-update', (data) => {
    console.log('Nouveau niveau:', data)
  })
  
  // S'abonner aux alertes
  mqtt.on('alert', (data) => {
    console.log('Nouvelle alerte:', data)
  })
})

onUnmounted(() => {
  // Nettoyer les écouteurs
  mqtt.off('level-update')
  mqtt.off('alert')
})
</script>
\`\`\`

## Sécurité MQTT

### En Production

1. **Utiliser TLS/SSL**
   \`\`\`conf
   listener 8883
   protocol mqtt
   cafile /etc/mosquitto/certs/ca.crt
   certfile /etc/mosquitto/certs/server.crt
   keyfile /etc/mosquitto/certs/server.key
   \`\`\`

2. **Authentification obligatoire**
   \`\`\`bash
   mosquitto_passwd -c /etc/mosquitto/passwd username
   \`\`\`

3. **ACL (Access Control List)**
   \`\`\`conf
   acl_file /etc/mosquitto/acl
   \`\`\`

   **Fichier ACL :**
   \`\`\`
   # Capteurs peuvent publier uniquement
   user sensor1
   topic write fueliot/station/+/tank/+/#
   
   # Application web peut lire uniquement
   user webapp
   topic read fueliot/#
   \`\`\`

4. **WebSocket sécurisé (WSS)**
   \`\`\`conf
   listener 9001
   protocol websockets
   cafile /etc/mosquitto/certs/ca.crt
   certfile /etc/mosquitto/certs/server.crt
   keyfile /etc/mosquitto/certs/server.key
   \`\`\`

## Tests et Débogage

### Tester avec Mosquitto Clients

**Publier un message :**
\`\`\`bash
mosquitto_pub -h localhost -t "fueliot/station/1/tank/1/level" -m '{"level": 8500, "percentage": 85}'
\`\`\`

**S'abonner à un topic :**
\`\`\`bash
mosquitto_sub -h localhost -t "fueliot/#" -v
\`\`\`

### Outils de Test

1. **MQTT Explorer** (GUI)
   - Interface graphique complète
   - Visualisation des topics
   - Publication/Souscription facile

2. **MQTTX** (GUI/CLI)
   - Client moderne
   - Support WebSocket
   - Scripts automatisés

3. **Postman** (API Testing)
   - Support MQTT natif
   - Collections de tests
   - Automatisation

## Monitoring

### Métriques à Surveiller

- Nombre de connexions actives
- Messages publiés/reçus par seconde
- Latence des messages
- Taux d'erreur de connexion
- Utilisation mémoire du broker

### Logs

Activer les logs détaillés dans Mosquitto :
\`\`\`conf
log_dest file /var/log/mosquitto/mosquitto.log
log_type all
log_timestamp true
\`\`\`

## Troubleshooting

### Problème : Connexion refusée

**Solution :**
- Vérifier que le broker est démarré
- Vérifier le port (9001 pour WebSocket)
- Vérifier le firewall
- Vérifier les credentials

### Problème : Messages non reçus

**Solution :**
- Vérifier la souscription aux bons topics
- Vérifier le format des messages
- Vérifier les ACL si activées
- Vérifier les logs du broker

### Problème : Déconnexions fréquentes

**Solution :**
- Augmenter le keepalive
- Vérifier la stabilité réseau
- Vérifier les ressources du broker
- Activer la reconnexion automatique

## Ressources

- [Documentation MQTT.js](https://github.com/mqttjs/MQTT.js)
- [Eclipse Mosquitto](https://mosquitto.org/)
- [MQTT Protocol Specification](https://mqtt.org/)
- [HiveMQ MQTT Essentials](https://www.hivemq.com/mqtt-essentials/)
\`\`\`
