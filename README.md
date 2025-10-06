# FuelIoT - Plateforme de Suivi de Carburant

Plateforme IoT complète pour le suivi en temps réel des niveaux de carburant dans les stations-service avec détection automatique des pertes et vols.

## Technologies

- **Vue.js 3** - Framework JavaScript progressif
- **Vite** - Build tool ultra-rapide
- **Pinia** - Gestion d'état pour Vue
- **Vue Router** - Routing officiel pour Vue
- **Tailwind CSS v4** - Framework CSS utility-first
- **Recharts** - Bibliothèque de graphiques pour React (compatible Vue)
- **MQTT.js** - Client MQTT pour communication IoT temps réel
- **Lucide Vue** - Icônes modernes
- **date-fns** - Manipulation de dates

## Fonctionnalités

### Authentification et Gestion des Utilisateurs
- Connexion sécurisée avec JWT
- Gestion des rôles (Super Admin, Admin Station, Manager)
- Gestion des permissions par station
- Interface d'administration des utilisateurs

### Dashboard Temps Réel
- Vue globale de toutes les stations
- Statistiques en direct (volume total, occupation, alertes)
- Graphiques de niveaux de carburant temps réel
- Carte interactive des stations
- Mise à jour automatique via MQTT

### Gestion des Stations et Cuves
- Création et modification de stations
- Gestion des cuves (essence, gasoil)
- Visualisation des niveaux avec jauges circulaires
- Historique de consommation par cuve
- Localisation GPS des stations

### Système d'Alertes
- Détection automatique des anomalies
- Alertes de niveau bas, fuites, vols
- Notifications en temps réel (toast)
- Gestion et résolution des alertes
- Filtrage avancé par type, statut, station

### Rapports et Statistiques
- Graphiques de tendances de consommation
- Comparaison entre stations
- Analyse par type de carburant
- Heures de pointe
- Export de données (PDF, Excel, CSV)
- KPIs détaillés

### Monitoring Temps Réel
- Connexion MQTT en direct
- Graphiques temps réel avec historique
- Visualisation des cuves en direct
- Indicateurs de connexion et latence

## Installation

### Prérequis

- Node.js 18+ et npm/yarn/pnpm
- Un broker MQTT (Eclipse Mosquitto, HiveMQ, etc.)

### Étapes d'installation

1. **Cloner le projet**
\`\`\`bash
git clone <repository-url>
cd fuel-iot-platform
\`\`\`

2. **Installer les dépendances**
\`\`\`bash
npm install
# ou
yarn install
# ou
pnpm install
\`\`\`

3. **Configuration de l'environnement**

Créer un fichier `.env` à la racine du projet :

\`\`\`env
# API Backend
VITE_API_URL=http://localhost:3000/api

# MQTT Configuration
VITE_MQTT_BROKER_URL=ws://localhost:9001
VITE_MQTT_USERNAME=your_username
VITE_MQTT_PASSWORD=your_password
\`\`\`

4. **Lancer le serveur de développement**
\`\`\`bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
\`\`\`

L'application sera accessible sur `http://localhost:5173`

5. **Build pour la production**
\`\`\`bash
npm run build
# ou
yarn build
# ou
pnpm build
\`\`\`

Les fichiers de production seront générés dans le dossier `dist/`

## Structure du Projet

\`\`\`
fuel-iot-platform/
├── public/              # Fichiers statiques
├── src/
│   ├── assets/         # Styles globaux (globals.css)
│   ├── components/     # Composants Vue réutilisables
│   │   ├── alerts/     # Composants d'alertes
│   │   ├── dashboard/  # Composants du dashboard
│   │   ├── layout/     # Layout et navigation
│   │   ├── realtime/   # Composants temps réel
│   │   ├── reports/    # Composants de rapports
│   │   ├── stations/   # Composants de stations
│   │   ├── ui/         # Composants UI de base
│   │   └── users/      # Composants de gestion utilisateurs
│   ├── composables/    # Composables Vue (hooks)
│   ├── layouts/        # Layouts de pages
│   ├── router/         # Configuration Vue Router
│   ├── services/       # Services (API, MQTT)
│   ├── stores/         # Stores Pinia (état global)
│   ├── views/          # Pages/Vues de l'application
│   ├── App.vue         # Composant racine
│   └── main.js         # Point d'entrée
├── .env.example        # Exemple de configuration
├── index.html          # HTML principal
├── package.json        # Dépendances
├── vite.config.js      # Configuration Vite
└── README.md           # Documentation
\`\`\`

## Configuration MQTT

### Topics MQTT

L'application s'abonne aux topics suivants :

- `station/{stationId}/tank/{tankId}/level` - Niveau de carburant
- `station/{stationId}/tank/{tankId}/temperature` - Température
- `station/{stationId}/tank/{tankId}/alert` - Alertes
- `station/{stationId}/status` - Statut de la station

### Format des messages

**Niveau de carburant :**
\`\`\`json
{
  "tankId": "tank-1",
  "stationId": "station-1",
  "level": 8500,
  "capacity": 10000,
  "percentage": 85,
  "timestamp": "2025-01-10T14:30:00Z"
}
\`\`\`

**Alerte :**
\`\`\`json
{
  "type": "low_level",
  "severity": "warning",
  "tankId": "tank-1",
  "stationId": "station-1",
  "message": "Niveau de carburant bas",
  "timestamp": "2025-01-10T14:30:00Z"
}
\`\`\`

## API Backend

L'application nécessite un backend REST API avec les endpoints suivants :

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Utilisateur connecté

### Stations
- `GET /api/stations` - Liste des stations
- `GET /api/stations/:id` - Détails d'une station
- `POST /api/stations` - Créer une station
- `PUT /api/stations/:id` - Modifier une station
- `DELETE /api/stations/:id` - Supprimer une station

### Cuves
- `GET /api/stations/:stationId/tanks` - Liste des cuves
- `POST /api/stations/:stationId/tanks` - Créer une cuve
- `PUT /api/tanks/:id` - Modifier une cuve
- `DELETE /api/tanks/:id` - Supprimer une cuve

### Alertes
- `GET /api/alerts` - Liste des alertes
- `GET /api/alerts/:id` - Détails d'une alerte
- `PUT /api/alerts/:id/resolve` - Résoudre une alerte
- `DELETE /api/alerts/:id` - Supprimer une alerte

### Rapports
- `GET /api/reports/consumption` - Rapport de consommation
- `GET /api/reports/performance` - Rapport de performance
- `POST /api/reports/export` - Exporter un rapport

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

## Personnalisation du Design

Le design utilise un système de tokens CSS définis dans `src/assets/globals.css`. Vous pouvez personnaliser les couleurs en modifiant les variables CSS :

\`\`\`css
@theme inline {
  /* Couleurs principales */
  --color-primary: #ff6b35;
  --color-accent: #3b82f6;
  
  /* Couleurs de fond */
  --color-background: #0a0e1a;
  --color-card: #131827;
  
  /* Texte */
  --color-foreground: #f8fafc;
  --color-muted-foreground: #94a3b8;
  
  /* Bordures */
  --color-border: #1e293b;
}
\`\`\`

## Déploiement

### Vercel (Recommandé)
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Netlify
\`\`\`bash
npm run build
# Déployer le dossier dist/
\`\`\`

### Docker
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
\`\`\`

## Sécurité

- Toutes les communications doivent utiliser HTTPS/WSS en production
- Les mots de passe doivent être hashés avec bcrypt/argon2
- Utiliser JWT pour l'authentification
- Implémenter RBAC (Role-Based Access Control)
- Valider toutes les entrées utilisateur
- Protection CSRF pour les formulaires

## Support et Contribution

Pour toute question ou contribution, veuillez ouvrir une issue sur le repository GitHub.

## Licence

MIT License - Voir le fichier LICENSE pour plus de détails.
