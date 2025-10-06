# Guide de Démarrage Rapide

Lancez votre plateforme FuelIoT en 5 minutes.

## Prérequis

- Node.js 18+ installé
- Un éditeur de code (VS Code recommandé)
- Terminal/Console

## Installation Express

### 1. Cloner et Installer

\`\`\`bash
# Cloner le projet
git clone <repository-url>
cd fuel-iot-platform

# Installer les dépendances
npm install
\`\`\`

### 2. Configuration Minimale

Créer un fichier \`.env\` à la racine :

\`\`\`env
VITE_API_URL=http://localhost:3000/api
VITE_MQTT_BROKER_URL=ws://localhost:9001
\`\`\`

### 3. Lancer l'Application

\`\`\`bash
npm run dev
\`\`\`

Ouvrir [http://localhost:5173](http://localhost:5173)

### 4. Connexion

**Compte de démonstration :**
- Email : \`admin@fueliot.com\`
- Mot de passe : \`admin123\`

## Données de Démonstration

L'application inclut des données simulées pour tester toutes les fonctionnalités :

- 4 stations-service
- 16 cuves (4 par station)
- Données temps réel simulées
- Alertes automatiques
- Graphiques interactifs

## Navigation Rapide

### Dashboard
Vue d'ensemble de toutes vos stations avec statistiques en temps réel.

**URL :** [http://localhost:5173/](http://localhost:5173/)

### Stations
Gérez vos stations et visualisez les détails de chaque cuve.

**URL :** [http://localhost:5173/stations](http://localhost:5173/stations)

### Alertes
Consultez et gérez toutes les alertes actives et historiques.

**URL :** [http://localhost:5173/alerts](http://localhost:5173/alerts)

### Rapports
Analysez les données avec des graphiques et exportez des rapports.

**URL :** [http://localhost:5173/reports](http://localhost:5173/reports)

### Temps Réel
Surveillez les niveaux de carburant en direct avec MQTT.

**URL :** [http://localhost:5173/realtime](http://localhost:5173/realtime)

### Utilisateurs
Gérez les accès et permissions de votre équipe.

**URL :** [http://localhost:5173/users](http://localhost:5173/users)

## Fonctionnalités Clés

### Surveillance Temps Réel
- Mise à jour automatique toutes les 30 secondes
- Graphiques interactifs
- Jauges visuelles par cuve
- Indicateurs de connexion MQTT

### Alertes Intelligentes
- Détection automatique des anomalies
- Notifications en temps réel
- Classification par sévérité
- Actions recommandées

### Rapports Détaillés
- Graphiques de tendances
- Comparaison entre stations
- Export PDF/Excel/CSV
- KPIs personnalisables

### Gestion Multi-Utilisateurs
- Rôles et permissions
- Accès par station
- Authentification sécurisée
- Audit des actions

## Configuration Avancée

### Connecter un Broker MQTT Réel

1. Installer Mosquitto :
\`\`\`bash
# Ubuntu/Debian
sudo apt-get install mosquitto

# macOS
brew install mosquitto
\`\`\`

2. Démarrer le broker :
\`\`\`bash
mosquitto -c mosquitto.conf
\`\`\`

3. Mettre à jour \`.env\` :
\`\`\`env
VITE_MQTT_BROKER_URL=ws://votre-broker:9001
VITE_MQTT_USERNAME=votre-username
VITE_MQTT_PASSWORD=votre-password
\`\`\`

### Connecter une API Backend

1. Mettre à jour \`.env\` :
\`\`\`env
VITE_API_URL=https://votre-api.com/api
\`\`\`

2. L'application utilisera automatiquement l'API au lieu des données simulées.

## Personnalisation

### Changer les Couleurs

Éditer \`src/assets/globals.css\` :

\`\`\`css
@theme inline {
  --color-primary: #ff6b35;  /* Votre couleur principale */
  --color-accent: #3b82f6;   /* Votre couleur d'accent */
}
\`\`\`

### Ajouter une Station

1. Aller dans **Stations**
2. Cliquer sur **Ajouter une station**
3. Remplir le formulaire
4. Ajouter des cuves à la station

### Configurer les Alertes

1. Aller dans **Paramètres**
2. Section **Notifications**
3. Activer/Désactiver les types d'alertes
4. Configurer les seuils

## Déploiement

### Build de Production

\`\`\`bash
npm run build
\`\`\`

Les fichiers optimisés seront dans \`dist/\`

### Déployer sur Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Déployer sur Netlify

1. Connecter votre repository GitHub
2. Configuration :
   - Build command : \`npm run build\`
   - Publish directory : \`dist\`
3. Déployer

## Support

### Problèmes Courants

**L'application ne démarre pas**
- Vérifier Node.js version (18+)
- Supprimer \`node_modules\` et réinstaller
- Vérifier les erreurs dans la console

**MQTT ne se connecte pas**
- Vérifier que le broker est démarré
- Vérifier l'URL dans \`.env\`
- Vérifier le port (9001 pour WebSocket)

**Les données ne s'affichent pas**
- Vérifier la console du navigateur
- Vérifier la connexion API
- Vérifier les données simulées

### Obtenir de l'Aide

- Documentation complète : [README.md](README.md)
- Guide MQTT : [MQTT_INTEGRATION.md](MQTT_INTEGRATION.md)
- Issues GitHub : Ouvrir une issue sur le repository

## Prochaines Étapes

1. Explorer toutes les pages de l'application
2. Tester les différentes fonctionnalités
3. Configurer votre broker MQTT
4. Connecter votre API backend
5. Personnaliser le design
6. Déployer en production

Bon développement avec FuelIoT !
\`\`\`
