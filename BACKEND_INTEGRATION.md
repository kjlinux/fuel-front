# Guide d'Intégration Backend - FuelIoT Platform

> Documentation technique complète pour l'intégration du frontend Vue.js avec un backend Laravel, PostgreSQL et HiveMQ MQTT.

---

## Table des Matières

1. [Architecture Générale](#1-architecture-générale)
2. [Backend Laravel (API REST)](#2-backend-laravel-api-rest)
3. [Base de Données PostgreSQL](#3-base-de-données-postgresql)
4. [Intégration MQTT (HiveMQ)](#4-intégration-mqtt-hivemq)
5. [Communication Frontend / Backend / MQTT](#5-communication-frontend--backend--mqtt)
6. [Sécurité](#6-sécurité)
7. [Déploiement & Environnement](#7-déploiement--environnement)
8. [Bonnes Pratiques & Recommandations](#8-bonnes-pratiques--recommandations)

---

## 1. Architecture Générale

### 1.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Navigateur   │  │  App Mobile  │  │  Capteurs    │              │
│  │  (Vue.js SPA) │  │  (futur)     │  │  IoT         │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │ HTTPS/REST       │ HTTPS/REST       │ MQTT/TLS
          │ + WSS/MQTT       │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────────────┐
│                     INFRASTRUCTURE                                   │
│                                                                      │
│  ┌─────────────────────┐       ┌─────────────────────┐              │
│  │   Laravel API        │       │   HiveMQ Broker      │              │
│  │   (REST + Auth)      │◄─────►│   (MQTT)             │              │
│  │                      │ sub/  │                      │              │
│  │  - Controllers       │ pub   │  - Topics            │              │
│  │  - Middleware         │       │  - ACL               │              │
│  │  - Form Requests     │       │  - TLS/SSL           │              │
│  │  - API Resources     │       │  - Clustering        │              │
│  └──────────┬───────────┘       └──────────────────────┘              │
│             │                                                        │
│  ┌──────────▼───────────┐       ┌─────────────────────┐              │
│  │   PostgreSQL          │       │   Redis              │              │
│  │   (Données)           │       │   (Cache + Queue)    │              │
│  │                      │       │                      │              │
│  │  - Stations          │       │  - Sessions          │              │
│  │  - Tanks             │       │  - Cache API         │              │
│  │  - Alerts            │       │  - Jobs Queue        │              │
│  │  - Deliveries        │       │  - Rate Limiting     │              │
│  │  - Tank Levels       │       │                      │              │
│  └──────────────────────┘       └──────────────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Séparation des Responsabilités

| Couche | Technologie | Responsabilité |
|--------|-------------|----------------|
| **Frontend SPA** | Vue.js 3 + Pinia | Interface utilisateur, affichage temps réel, graphiques, navigation |
| **API REST** | Laravel 11 | Logique métier, CRUD, authentification, autorisation, validation |
| **Broker MQTT** | HiveMQ | Transport temps réel des données capteurs, pub/sub bidirectionnel |
| **Base de données** | PostgreSQL 16 | Persistance des données, historique, requêtes analytiques |
| **Cache / Queue** | Redis | Cache API, sessions, file d'attente des jobs asynchrones |

### 1.3 Flux de Données

**Flux CRUD (REST) :**
```
Vue.js SPA  ──HTTP/JSON──►  Laravel API  ──Eloquent──►  PostgreSQL
   (Pinia Store)              (Controller)                (Tables)
        ◄── JSON Response ──     ◄── Collection/Model ──
```

**Flux Temps Réel (MQTT) :**
```
Capteur IoT ──MQTT──► HiveMQ Broker ──MQTT──► Vue.js (useMqtt.js → Pinia)
                           │
                           ├──MQTT──► Laravel Subscriber
                           │              │
                           │              ▼
                           │         PostgreSQL (historisation)
                           │              │
                           │              ▼
                           │         Détection alertes/livraisons
```

**Flux Commandes (vers capteurs) :**
```
Vue.js ──REST──► Laravel API ──MQTT publish──► HiveMQ ──► Capteur IoT
```

### 1.4 Principe de Communication Dual

| Besoin | Protocole | Justification |
|--------|-----------|---------------|
| Authentification | REST | Stateless, token-based, standard HTTP |
| CRUD Stations/Tanks | REST | Opérations classiques, idempotentes |
| Niveaux temps réel | MQTT | Latence minimale, push natif |
| Alertes instantanées | MQTT | Notification immédiate, QoS garanti |
| Rapports / Analytics | REST | Requêtes complexes, agrégations SQL |
| Livraisons | REST + MQTT | CRUD via REST, auto-détection via MQTT |
| Commandes capteurs | REST → MQTT | API déclenche la publication MQTT |

---

## 2. Backend Laravel (API REST)

### 2.1 Structure du Projet Laravel

```
fuel-api/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       └── MqttSubscribeCommand.php    # Subscriber MQTT
│   ├── Enums/
│   │   ├── AlertSeverity.php               # info, warning, error, critical
│   │   ├── AlertType.php                   # low_level, anomaly, temperature...
│   │   ├── FuelType.php                    # essence, gasoil
│   │   ├── StationStatus.php              # online, offline, maintenance
│   │   └── UserRole.php                   # super_admin, admin, manager
│   ├── Events/
│   │   ├── TankLevelUpdated.php
│   │   ├── AlertCreated.php
│   │   └── DeliveryDetected.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           ├── AuthController.php
│   │   │           ├── StationController.php
│   │   │           ├── TankController.php
│   │   │           ├── AlertController.php
│   │   │           ├── DeliveryController.php
│   │   │           ├── UserController.php
│   │   │           └── ReportController.php
│   │   ├── Middleware/
│   │   │   ├── CheckRole.php
│   │   │   └── EnsureStationAccess.php
│   │   ├── Requests/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginRequest.php
│   │   │   │   └── RegisterRequest.php
│   │   │   ├── Station/
│   │   │   │   ├── StoreStationRequest.php
│   │   │   │   └── UpdateStationRequest.php
│   │   │   ├── Tank/
│   │   │   │   ├── StoreTankRequest.php
│   │   │   │   └── UpdateTankRequest.php
│   │   │   ├── Alert/
│   │   │   │   └── ResolveAlertRequest.php
│   │   │   └── Delivery/
│   │   │       ├── StoreDeliveryRequest.php
│   │   │       └── UpdateDeliveryRequest.php
│   │   └── Resources/
│   │       ├── StationResource.php
│   │       ├── StationCollection.php
│   │       ├── TankResource.php
│   │       ├── AlertResource.php
│   │       ├── DeliveryResource.php
│   │       ├── UserResource.php
│   │       └── ReportResource.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Station.php
│   │   ├── Tank.php
│   │   ├── Alert.php
│   │   ├── Delivery.php
│   │   └── TankLevel.php
│   ├── Observers/
│   │   └── TankLevelObserver.php           # Détection livraisons/alertes
│   ├── Policies/
│   │   ├── StationPolicy.php
│   │   ├── AlertPolicy.php
│   │   └── DeliveryPolicy.php
│   └── Services/
│       ├── MqttService.php                 # Publish/Subscribe MQTT
│       ├── AlertDetectionService.php       # Logique de détection
│       └── DeliveryDetectionService.php    # Détection auto livraisons
├── config/
│   ├── mqtt.php                            # Configuration MQTT
│   └── cors.php                            # Configuration CORS
├── database/
│   └── migrations/
├── routes/
│   └── api.php                             # Routes API v1
└── .env
```

### 2.2 Routes API

```php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1;

/*
|--------------------------------------------------------------------------
| Routes publiques (sans authentification)
|--------------------------------------------------------------------------
*/
Route::prefix('v1')->group(function () {

    Route::post('/auth/login', [V1\AuthController::class, 'login']);
    Route::post('/auth/register', [V1\AuthController::class, 'register']);

    /*
    |----------------------------------------------------------------------
    | Routes protégées (authentification Sanctum requise)
    |----------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('/auth/logout', [V1\AuthController::class, 'logout']);
        Route::get('/auth/me', [V1\AuthController::class, 'me']);

        // Stations
        Route::apiResource('stations', V1\StationController::class);

        // Tanks (imbriqués sous stations)
        Route::apiResource('stations.tanks', V1\TankController::class)
            ->shallow();

        // Alertes
        Route::get('/alerts', [V1\AlertController::class, 'index']);
        Route::get('/alerts/{alert}', [V1\AlertController::class, 'show']);
        Route::put('/alerts/{alert}/resolve', [V1\AlertController::class, 'resolve']);
        Route::delete('/alerts/{alert}', [V1\AlertController::class, 'destroy']);

        // Livraisons (Dépotages)
        Route::apiResource('deliveries', V1\DeliveryController::class);
        Route::put('/deliveries/{delivery}/validate',
            [V1\DeliveryController::class, 'validateDelivery']);

        // Rapports
        Route::prefix('reports')->group(function () {
            Route::get('/consumption', [V1\ReportController::class, 'consumption']);
            Route::get('/performance', [V1\ReportController::class, 'performance']);
            Route::get('/peak-hours', [V1\ReportController::class, 'peakHours']);
            Route::get('/fuel-distribution', [V1\ReportController::class, 'fuelDistribution']);
            Route::post('/export', [V1\ReportController::class, 'export']);
        });

        // Utilisateurs (admin uniquement)
        Route::apiResource('users', V1\UserController::class)
            ->middleware('role:super_admin,admin');
    });
});
```

### 2.3 Tableau des Endpoints

| Méthode | Endpoint | Description | Rôles |
|---------|----------|-------------|-------|
| `POST` | `/api/v1/auth/login` | Connexion utilisateur | Public |
| `POST` | `/api/v1/auth/register` | Inscription | Public |
| `POST` | `/api/v1/auth/logout` | Déconnexion | Authentifié |
| `GET` | `/api/v1/auth/me` | Profil utilisateur courant | Authentifié |
| `GET` | `/api/v1/stations` | Liste des stations | Authentifié |
| `POST` | `/api/v1/stations` | Créer une station | admin, super_admin |
| `GET` | `/api/v1/stations/{id}` | Détail d'une station (avec tanks) | Authentifié |
| `PUT` | `/api/v1/stations/{id}` | Modifier une station | admin, super_admin |
| `DELETE` | `/api/v1/stations/{id}` | Supprimer une station | super_admin |
| `GET` | `/api/v1/stations/{id}/tanks` | Tanks d'une station | Authentifié |
| `POST` | `/api/v1/stations/{id}/tanks` | Ajouter un tank | admin, super_admin |
| `GET` | `/api/v1/tanks/{id}` | Détail d'un tank | Authentifié |
| `PUT` | `/api/v1/tanks/{id}` | Modifier un tank | admin, super_admin |
| `DELETE` | `/api/v1/tanks/{id}` | Supprimer un tank | super_admin |
| `GET` | `/api/v1/alerts` | Liste des alertes (filtrable) | Authentifié |
| `GET` | `/api/v1/alerts/{id}` | Détail d'une alerte | Authentifié |
| `PUT` | `/api/v1/alerts/{id}/resolve` | Résoudre une alerte | admin, super_admin |
| `DELETE` | `/api/v1/alerts/{id}` | Supprimer une alerte | super_admin |
| `GET` | `/api/v1/deliveries` | Liste des livraisons | Authentifié |
| `POST` | `/api/v1/deliveries` | Créer une livraison | admin, super_admin |
| `GET` | `/api/v1/deliveries/{id}` | Détail d'une livraison | Authentifié |
| `PUT` | `/api/v1/deliveries/{id}` | Modifier une livraison | admin, super_admin |
| `DELETE` | `/api/v1/deliveries/{id}` | Supprimer une livraison | super_admin |
| `PUT` | `/api/v1/deliveries/{id}/validate` | Valider une livraison | admin, super_admin |
| `GET` | `/api/v1/reports/consumption` | Rapport consommation | Authentifié |
| `GET` | `/api/v1/reports/performance` | Rapport performance stations | Authentifié |
| `GET` | `/api/v1/reports/peak-hours` | Heures de pointe | Authentifié |
| `GET` | `/api/v1/reports/fuel-distribution` | Répartition par carburant | Authentifié |
| `POST` | `/api/v1/reports/export` | Exporter un rapport (PDF/Excel/CSV) | Authentifié |
| `GET` | `/api/v1/users` | Liste des utilisateurs | admin, super_admin |
| `POST` | `/api/v1/users` | Créer un utilisateur | super_admin |
| `PUT` | `/api/v1/users/{id}` | Modifier un utilisateur | admin, super_admin |
| `DELETE` | `/api/v1/users/{id}` | Supprimer un utilisateur | super_admin |

### 2.4 Paramètres de Filtrage et Pagination

**Alertes** (`GET /api/v1/alerts`) :
```
?severity=critical,warning        # Filtrer par sévérité
&type=low_level,anomaly           # Filtrer par type
&status=active                    # active | resolved | all
&station_id=1                     # Filtrer par station
&page=1&per_page=20               # Pagination
&sort=-created_at                 # Tri (- = descendant)
```

**Livraisons** (`GET /api/v1/deliveries`) :
```
?station_id=1                     # Filtrer par station
&tank_id=2                        # Filtrer par tank
&fuel_type=essence                # essence | gasoil
&validated=false                  # true | false
&date_from=2025-01-01             # Date début
&date_to=2025-01-31               # Date fin
&page=1&per_page=20               # Pagination
```

**Rapports** (`GET /api/v1/reports/consumption`) :
```
?period=month                     # today | week | month | quarter | year
&station_id=1                     # Filtrer par station (optionnel)
&date_from=2025-01-01             # Période personnalisée
&date_to=2025-01-31
```

### 2.5 Authentification - Laravel Sanctum

Laravel Sanctum est recommandé pour ce SPA car il fournit une authentification token-based légère, parfaitement adaptée aux applications Vue.js.

**Installation :**
```bash
composer require laravel/sanctum
php artisan install:api
```

**AuthController.php :**
```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Identifiants invalides.',
            ], 401);
        }

        $token = $user->createToken('fuel-iot-app')->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * POST /api/v1/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role ?? 'manager',
        ]);

        $token = $user->createToken('fuel-iot-app')->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(): JsonResponse
    {
        auth()->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(): JsonResponse
    {
        return response()->json([
            'user' => new UserResource(auth()->user()->load('stations')),
        ]);
    }
}
```

**Intégration côté Vue.js** - Remplacement dans `src/stores/auth.js` :
```javascript
// src/stores/auth.js - Intégration API réelle
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const API_URL = import.meta.env.VITE_API_URL

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')))
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role)

  async function login(email, password) {
    const response = await fetch(`${API_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur de connexion')
    }

    const data = await response.json()
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  async function logout() {
    try {
      await fetch(`${API_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Accept': 'application/json',
        },
      })
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  async function fetchUser() {
    const response = await fetch(`${API_URL}/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) throw new Error('Session expirée')
    const data = await response.json()
    user.value = data.user
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  return { user, token, isAuthenticated, userRole, login, logout, fetchUser }
})
```

### 2.6 Middleware de Rôles

```php
<?php
// app/Http/Middleware/CheckRole.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Accès interdit. Rôle requis : ' . implode(', ', $roles),
            ], 403);
        }

        return $next($request);
    }
}
```

**Enregistrement dans `bootstrap/app.php` :**
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\CheckRole::class,
    ]);
})
```

### 2.7 Form Request - Validation

```php
<?php
// app/Http/Requests/Station/StoreStationRequest.php

namespace App\Http\Requests\Station;

use Illuminate\Foundation\Http\FormRequest;

class StoreStationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['super_admin', 'admin']);
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255'],
            'address'   => ['required', 'string', 'max:500'],
            'latitude'  => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'status'    => ['sometimes', 'in:online,offline,maintenance'],
            'manager'   => ['nullable', 'string', 'max:255'],
            'phone'     => ['nullable', 'string', 'max:20'],
            'email'     => ['nullable', 'email', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'    => 'Le nom de la station est obligatoire.',
            'address.required' => "L'adresse est obligatoire.",
            'latitude.between' => 'La latitude doit être entre -90 et 90.',
            'longitude.between'=> 'La longitude doit être entre -180 et 180.',
        ];
    }
}
```

```php
<?php
// app/Http/Requests/Delivery/StoreDeliveryRequest.php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['super_admin', 'admin']);
    }

    public function rules(): array
    {
        return [
            'station_id'         => ['required', 'exists:stations,id'],
            'tank_id'            => ['required', 'exists:tanks,id'],
            'fuel_type'          => ['required', 'in:essence,gasoil'],
            'level_before'       => ['required', 'numeric', 'min:0'],
            'quantity_delivered'  => ['required', 'numeric', 'min:1'],
            'level_after'        => ['required', 'numeric', 'min:0'],
            'delivery_date'      => ['required', 'date'],
            'delivered_by'       => ['required', 'string', 'max:255'],
            'driver_name'        => ['required', 'string', 'max:255'],
            'truck_number'       => ['required', 'string', 'max:50'],
            'order_number'       => ['nullable', 'string', 'max:100'],
            'notes'              => ['nullable', 'string', 'max:1000'],
            'temperature'        => ['nullable', 'numeric', 'between:-20,60'],
            'density'            => ['nullable', 'numeric', 'between:0.5,1.0'],
        ];
    }
}
```

### 2.8 API Resources

```php
<?php
// app/Http/Resources/StationResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'name'      => $this->name,
            'address'   => $this->address,
            'location'  => [
                'lat' => (float) $this->latitude,
                'lng' => (float) $this->longitude,
            ],
            'status'    => $this->status,
            'manager'   => $this->manager,
            'phone'     => $this->phone,
            'email'     => $this->email,
            'tanks'     => TankResource::collection($this->whenLoaded('tanks')),
            'lastUpdate'=> $this->updated_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
```

```php
<?php
// app/Http/Resources/AlertResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'type'            => $this->type,
            'severity'        => $this->severity,
            'stationId'       => $this->station_id,
            'stationName'     => $this->station->name,
            'tankId'          => $this->tank_id,
            'tankName'        => $this->tank?->name,
            'fuelType'        => $this->tank?->fuel_type,
            'message'         => $this->message,
            'details'         => $this->details,
            'timestamp'       => $this->created_at->toISOString(),
            'resolved'        => $this->resolved,
            'resolvedAt'      => $this->resolved_at?->toISOString(),
            'resolutionNotes' => $this->resolution_notes,
        ];
    }
}
```

```php
<?php
// app/Http/Resources/DeliveryResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'stationId'         => $this->station_id,
            'stationName'       => $this->station->name,
            'tankId'            => $this->tank_id,
            'tankName'          => $this->tank->name,
            'fuelType'          => $this->fuel_type,
            'levelBefore'       => (float) $this->level_before,
            'quantityDelivered' => (float) $this->quantity_delivered,
            'levelAfter'        => (float) $this->level_after,
            'deliveryDate'      => $this->delivery_date->toISOString(),
            'deliveredBy'       => $this->delivered_by,
            'driverName'        => $this->driver_name,
            'truckNumber'       => $this->truck_number,
            'orderNumber'       => $this->order_number,
            'notes'             => $this->notes,
            'temperature'       => (float) $this->temperature,
            'density'           => (float) $this->density,
            'validated'         => $this->validated,
            'validatedBy'       => $this->validator?->name,
            'validatedAt'       => $this->validated_at?->toISOString(),
        ];
    }
}
```

### 2.9 Controllers

```php
<?php
// app/Http/Controllers/Api/V1/StationController.php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Station\StoreStationRequest;
use App\Http\Requests\Station\UpdateStationRequest;
use App\Http\Resources\StationResource;
use App\Models\Station;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StationController extends Controller
{
    /**
     * GET /api/v1/stations
     */
    public function index(Request $request): JsonResponse
    {
        $query = Station::with('tanks');

        // Filtrage par statut
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Recherche par nom
        if ($request->has('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }

        // Restriction par stations assignées (manager)
        if ($request->user()->role === 'manager') {
            $query->whereHas('users', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            });
        }

        $stations = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => StationResource::collection($stations),
            'meta' => [
                'current_page' => $stations->currentPage(),
                'last_page'    => $stations->lastPage(),
                'per_page'     => $stations->perPage(),
                'total'        => $stations->total(),
            ],
        ]);
    }

    /**
     * POST /api/v1/stations
     */
    public function store(StoreStationRequest $request): JsonResponse
    {
        $station = Station::create($request->validated());

        return response()->json([
            'data' => new StationResource($station->load('tanks')),
        ], 201);
    }

    /**
     * GET /api/v1/stations/{station}
     */
    public function show(Station $station): JsonResponse
    {
        return response()->json([
            'data' => new StationResource($station->load('tanks')),
        ]);
    }

    /**
     * PUT /api/v1/stations/{station}
     */
    public function update(UpdateStationRequest $request, Station $station): JsonResponse
    {
        $station->update($request->validated());

        return response()->json([
            'data' => new StationResource($station->fresh()->load('tanks')),
        ]);
    }

    /**
     * DELETE /api/v1/stations/{station}
     */
    public function destroy(Station $station): JsonResponse
    {
        $station->delete();

        return response()->json(null, 204);
    }
}
```

```php
<?php
// app/Http/Controllers/Api/V1/AlertController.php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Alert\ResolveAlertRequest;
use App\Http\Resources\AlertResource;
use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * GET /api/v1/alerts
     */
    public function index(Request $request): JsonResponse
    {
        $query = Alert::with(['station', 'tank']);

        if ($request->has('severity')) {
            $query->whereIn('severity', explode(',', $request->severity));
        }

        if ($request->has('type')) {
            $query->whereIn('type', explode(',', $request->type));
        }

        if ($request->get('status') === 'active') {
            $query->where('resolved', false);
        } elseif ($request->get('status') === 'resolved') {
            $query->where('resolved', true);
        }

        if ($request->has('station_id')) {
            $query->where('station_id', $request->station_id);
        }

        $sort = $request->get('sort', '-created_at');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');
        $query->orderBy($column, $direction);

        $alerts = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => AlertResource::collection($alerts),
            'meta' => [
                'current_page' => $alerts->currentPage(),
                'last_page'    => $alerts->lastPage(),
                'total'        => $alerts->total(),
            ],
        ]);
    }

    /**
     * PUT /api/v1/alerts/{alert}/resolve
     */
    public function resolve(ResolveAlertRequest $request, Alert $alert): JsonResponse
    {
        $alert->update([
            'resolved'         => true,
            'resolved_at'      => now(),
            'resolution_notes' => $request->notes,
        ]);

        return response()->json([
            'data' => new AlertResource($alert->fresh()->load(['station', 'tank'])),
        ]);
    }

    /**
     * GET /api/v1/alerts/{alert}
     */
    public function show(Alert $alert): JsonResponse
    {
        return response()->json([
            'data' => new AlertResource($alert->load(['station', 'tank'])),
        ]);
    }

    /**
     * DELETE /api/v1/alerts/{alert}
     */
    public function destroy(Alert $alert): JsonResponse
    {
        $alert->delete();
        return response()->json(null, 204);
    }
}
```

### 2.10 Gestion des Erreurs Normalisée

```php
<?php
// bootstrap/app.php (section withExceptions)

use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

->withExceptions(function (Exceptions $exceptions) {

    // Toutes les réponses d'erreur en JSON pour l'API
    $exceptions->renderable(function (ValidationException $e) {
        return response()->json([
            'message' => 'Erreur de validation.',
            'errors'  => $e->errors(),
        ], 422);
    });

    $exceptions->renderable(function (NotFoundHttpException $e) {
        return response()->json([
            'message' => 'Ressource introuvable.',
        ], 404);
    });

    $exceptions->renderable(function (AccessDeniedHttpException $e) {
        return response()->json([
            'message' => 'Accès interdit.',
        ], 403);
    });
})
```

**Format de réponse standard :**

```json
// Succès (200/201)
{
  "data": { ... },
  "meta": { "current_page": 1, "last_page": 5, "total": 100 }
}

// Erreur de validation (422)
{
  "message": "Erreur de validation.",
  "errors": {
    "name": ["Le nom de la station est obligatoire."],
    "latitude": ["La latitude doit être entre -90 et 90."]
  }
}

// Non authentifié (401)
{
  "message": "Unauthenticated."
}

// Interdit (403)
{
  "message": "Accès interdit. Rôle requis : admin, super_admin"
}

// Non trouvé (404)
{
  "message": "Ressource introuvable."
}

// Erreur serveur (500)
{
  "message": "Erreur interne du serveur."
}
```

---

## 3. Base de Données PostgreSQL

### 3.1 Schéma Relationnel

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────┐
│   users      │       │  station_user    │       │  stations     │
├─────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)     │──┐    │ user_id (FK)     │    ┌──│ id (PK)      │
│ name        │  └───►│ station_id (FK)  │◄───┘  │ name         │
│ email       │       │ created_at       │       │ address      │
│ password    │       └──────────────────┘       │ latitude     │
│ role        │                                  │ longitude    │
│ is_active   │                                  │ status       │
│ created_at  │                                  │ manager      │
│ updated_at  │                                  │ phone        │
└─────────────┘                                  │ email        │
      │                                          │ created_at   │
      │                                          │ updated_at   │
      │                                          └──────┬───────┘
      │                                                 │
      │                                          ┌──────▼───────┐
      │                                          │  tanks        │
      │                                          ├──────────────┤
      │                                       ┌──│ id (PK)      │
      │                                       │  │ station_id   │──► stations
      │                                       │  │ name         │
      │                                       │  │ fuel_type    │
      │                                       │  │ capacity     │
      │                                       │  │ current_level│
      │                                       │  │ percentage   │
      │                                       │  │ temperature  │
      │                                       │  │ sensor_id    │
      │                                       │  │ created_at   │
      │                                       │  │ updated_at   │
      │                                       │  └──────────────┘
      │                                       │         │
      │     ┌─────────────────┐               │  ┌──────▼───────┐
      │     │  alerts          │               │  │  tank_levels  │
      │     ├─────────────────┤               │  ├──────────────┤
      │     │ id (PK)         │               │  │ id (PK)      │
      │     │ type            │               │  │ tank_id (FK) │──► tanks
      │     │ severity        │               │  │ station_id   │──► stations
      │     │ station_id (FK) │──► stations   │  │ level        │
      │     │ tank_id (FK)    │──► tanks      │  │ percentage   │
      │     │ message         │               │  │ temperature  │
      │     │ details         │               │  │ recorded_at  │
      │     │ resolved        │               │  └──────────────┘
      │     │ resolved_at     │               │   (Partitionnée par mois)
      │     │ resolution_notes│               │
      │     │ created_at      │               │
      │     │ updated_at      │               │
      │     └─────────────────┘               │
      │                                       │
      │     ┌─────────────────┐               │
      │     │  deliveries      │               │
      │     ├─────────────────┤               │
      │     │ id (PK)         │               │
      │     │ station_id (FK) │──► stations   │
      │     │ tank_id (FK)    │──────────────►│
      │     │ fuel_type       │
      │     │ level_before    │
      │     │ quantity_delivered│
      │     │ level_after     │
      │     │ delivery_date   │
      │     │ delivered_by    │
      │     │ driver_name     │
      │     │ truck_number    │
      │     │ order_number    │
      │     │ notes           │
      │     │ temperature     │
      │     │ density         │
      │     │ validated       │
      │     │ validated_by(FK)│──► users
      │     │ validated_at    │
      │     │ created_at      │
      │     │ updated_at      │
      │     └─────────────────┘
```

### 3.2 Migrations Laravel

```php
<?php
// database/migrations/xxxx_create_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['super_admin', 'admin', 'manager'])->default('manager');
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();

            // Index
            $table->index('role');
            $table->index('is_active');
        });
    }
};
```

```php
<?php
// database/migrations/xxxx_create_stations_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->enum('status', ['online', 'offline', 'maintenance'])->default('offline');
            $table->string('manager')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->timestamps();

            // Index
            $table->index('status');
            $table->index(['latitude', 'longitude']);
        });
    }
};
```

```php
<?php
// database/migrations/xxxx_create_station_user_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('station_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['station_id', 'user_id']);
        });
    }
};
```

```php
<?php
// database/migrations/xxxx_create_tanks_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tanks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('fuel_type', ['essence', 'gasoil']);
            $table->decimal('capacity', 12, 2);           // en litres
            $table->decimal('current_level', 12, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->decimal('temperature', 5, 2)->nullable();
            $table->string('sensor_id')->nullable()->unique();
            $table->timestamps();

            // Index
            $table->index('station_id');
            $table->index('fuel_type');
            $table->index('sensor_id');
        });
    }
};
```

```php
<?php
// database/migrations/xxxx_create_alerts_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->string('type');              // low_level, anomaly, temperature, disconnected, delivery
            $table->string('severity');           // info, warning, error, critical
            $table->foreignId('station_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tank_id')->nullable()->constrained()->nullOnDelete();
            $table->text('message');
            $table->text('details')->nullable();
            $table->boolean('resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            // Index pour filtrage performant
            $table->index('type');
            $table->index('severity');
            $table->index('resolved');
            $table->index('station_id');
            $table->index(['resolved', 'severity']);      // Alertes actives critiques
            $table->index(['station_id', 'resolved']);    // Alertes par station
            $table->index('created_at');
        });
    }
};
```

```php
<?php
// database/migrations/xxxx_create_deliveries_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tank_id')->constrained()->cascadeOnDelete();
            $table->enum('fuel_type', ['essence', 'gasoil']);
            $table->decimal('level_before', 12, 2);
            $table->decimal('quantity_delivered', 12, 2);
            $table->decimal('level_after', 12, 2);
            $table->timestamp('delivery_date');
            $table->string('delivered_by');               // Nom du transporteur
            $table->string('driver_name');
            $table->string('truck_number');
            $table->string('order_number')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('temperature', 5, 2)->nullable();
            $table->decimal('density', 4, 3)->nullable(); // 0.740 ou 0.850
            $table->boolean('validated')->default(false);
            $table->foreignId('validated_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();

            // Index
            $table->index('station_id');
            $table->index('tank_id');
            $table->index('validated');
            $table->index('delivery_date');
            $table->index(['station_id', 'delivery_date']);
        });
    }
};
```

```php
<?php
// database/migrations/xxxx_create_tank_levels_table.php

return new class extends Migration
{
    public function up(): void
    {
        // Table d'historique des niveaux - volume élevé (1 lecture / 30s / tank)
        Schema::create('tank_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tank_id')->constrained()->cascadeOnDelete();
            $table->foreignId('station_id')->constrained()->cascadeOnDelete();
            $table->decimal('level', 12, 2);              // en litres
            $table->decimal('percentage', 5, 2);
            $table->decimal('temperature', 5, 2)->nullable();
            $table->timestamp('recorded_at');

            // Index critiques pour les requêtes de rapports
            $table->index(['tank_id', 'recorded_at']);
            $table->index(['station_id', 'recorded_at']);
            $table->index('recorded_at');
        });
    }
};
```

### 3.3 Modèles Eloquent

```php
<?php
// app/Models/Station.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Station extends Model
{
    protected $fillable = [
        'name', 'address', 'latitude', 'longitude',
        'status', 'manager', 'phone', 'email',
    ];

    protected $casts = [
        'latitude'  => 'float',
        'longitude' => 'float',
    ];

    public function tanks(): HasMany
    {
        return $this->hasMany(Tank::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function tankLevels(): HasMany
    {
        return $this->hasMany(TankLevel::class);
    }
}
```

```php
<?php
// app/Models/Tank.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tank extends Model
{
    protected $fillable = [
        'station_id', 'name', 'fuel_type', 'capacity',
        'current_level', 'percentage', 'temperature', 'sensor_id',
    ];

    protected $casts = [
        'capacity'      => 'float',
        'current_level' => 'float',
        'percentage'    => 'float',
        'temperature'   => 'float',
    ];

    public function station(): BelongsTo
    {
        return $this->belongsTo(Station::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    public function levels(): HasMany
    {
        return $this->hasMany(TankLevel::class)->orderByDesc('recorded_at');
    }
}
```

```php
<?php
// app/Models/Delivery.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends Model
{
    protected $fillable = [
        'station_id', 'tank_id', 'fuel_type',
        'level_before', 'quantity_delivered', 'level_after',
        'delivery_date', 'delivered_by', 'driver_name', 'truck_number',
        'order_number', 'notes', 'temperature', 'density',
        'validated', 'validated_by', 'validated_at',
    ];

    protected $casts = [
        'level_before'       => 'float',
        'quantity_delivered'  => 'float',
        'level_after'        => 'float',
        'temperature'        => 'float',
        'density'            => 'float',
        'validated'          => 'boolean',
        'delivery_date'      => 'datetime',
        'validated_at'       => 'datetime',
    ];

    public function station(): BelongsTo
    {
        return $this->belongsTo(Station::class);
    }

    public function tank(): BelongsTo
    {
        return $this->belongsTo(Tank::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
```

### 3.4 Indexation et Performances PostgreSQL

**Index composites recommandés :**

```sql
-- Alertes actives par station (vue AlertsView.vue)
CREATE INDEX idx_alerts_station_active ON alerts (station_id, created_at DESC)
    WHERE resolved = false;

-- Historique des niveaux par tank pour les charts (TankHistoryChart.vue)
CREATE INDEX idx_tank_levels_tank_period ON tank_levels (tank_id, recorded_at DESC);

-- Livraisons non validées (DeliveriesView.vue compteur pending)
CREATE INDEX idx_deliveries_pending ON deliveries (station_id, delivery_date DESC)
    WHERE validated = false;

-- Recherche full-text sur stations
CREATE INDEX idx_stations_name_trgm ON stations USING gin (name gin_trgm_ops);
```

**Partitionnement de `tank_levels` (volume élevé) :**

```sql
-- Partitionnement par plage de dates (mensuel)
CREATE TABLE tank_levels (
    id BIGSERIAL,
    tank_id BIGINT NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
    station_id BIGINT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    level DECIMAL(12, 2) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    temperature DECIMAL(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Partitions mensuelles (à créer automatiquement via pg_partman ou cron)
CREATE TABLE tank_levels_2025_01 PARTITION OF tank_levels
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE tank_levels_2025_02 PARTITION OF tank_levels
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- etc.
```

**Bonnes pratiques PostgreSQL :**

| Pratique | Détail |
|----------|--------|
| Timestamps avec timezone | Utiliser `TIMESTAMPTZ` (pas `TIMESTAMP`) |
| Enum vs String | Utiliser `enum` Laravel avec contraintes CHECK en BDD |
| JSONB pour metadata | Stocker les données flexibles des capteurs en JSONB si nécessaire |
| Vacuum automatique | Configurer `autovacuum_vacuum_scale_factor = 0.1` pour `tank_levels` |
| Connection pooling | Utiliser PgBouncer en production (mode transaction) |
| Requêtes analytiques | Utiliser des vues matérialisées pour les rapports récurrents |

**Vue matérialisée pour les rapports :**

```sql
-- Consommation journalière par station/tank
CREATE MATERIALIZED VIEW daily_consumption AS
SELECT
    tank_id,
    station_id,
    DATE(recorded_at) AS date,
    MAX(level) - MIN(level) AS consumption,
    AVG(temperature) AS avg_temperature,
    COUNT(*) AS readings_count
FROM tank_levels
GROUP BY tank_id, station_id, DATE(recorded_at)
WITH DATA;

-- Rafraîchir quotidiennement via cron/scheduler
-- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_consumption;
```

---

## 4. Intégration MQTT (HiveMQ)

### 4.1 Rôle du Protocole MQTT

MQTT (Message Queuing Telemetry Transport) est un protocole de messagerie léger conçu pour les appareils IoT. Dans le contexte FuelIoT :

| Caractéristique | Valeur |
|-----------------|--------|
| **Protocole** | MQTT v5 / v3.1.1 |
| **Transport** | TCP (capteurs) / WebSocket Secure (navigateurs) |
| **Modèle** | Publish/Subscribe (découplage producteur/consommateur) |
| **QoS** | 0 (at most once) pour niveaux, 1 (at least once) pour alertes |
| **Fréquence** | Niveaux : 30s, Température : 5min, Alertes : événementiel |

### 4.2 HiveMQ comme Broker

**Pourquoi HiveMQ :**
- Interface d'administration web intégrée
- Support natif de MQTT v5 et WebSocket
- Clustering horizontal pour la scalabilité
- Extensions Java pour logique personnalisée
- Cloud-managed ou self-hosted

**Installation Docker :**
```bash
docker run -d \
  --name hivemq \
  -p 1883:1883 \
  -p 8883:8883 \
  -p 8080:8080 \
  -p 8884:8884 \
  -v hivemq-data:/opt/hivemq/data \
  -v hivemq-conf:/opt/hivemq/conf \
  hivemq/hivemq4
```

| Port | Protocole | Usage |
|------|-----------|-------|
| 1883 | MQTT | Capteurs IoT (réseau interne) |
| 8883 | MQTT + TLS | Capteurs IoT (production) |
| 8080 | HTTP | Dashboard d'administration HiveMQ |
| 8884 | WSS (WebSocket Secure) | Navigateurs web (Vue.js) |

### 4.3 Configuration HiveMQ

**Fichier `config.xml` :**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<hivemq>
    <!-- MQTT Listener standard -->
    <listeners>
        <tcp-listener>
            <port>1883</port>
            <bind-address>0.0.0.0</bind-address>
        </tcp-listener>

        <!-- MQTT over TLS -->
        <tls-tcp-listener>
            <port>8883</port>
            <bind-address>0.0.0.0</bind-address>
            <tls>
                <keystore>
                    <path>/opt/hivemq/conf/keystore.jks</path>
                    <password>changeme</password>
                </keystore>
            </tls>
        </tls-tcp-listener>

        <!-- WebSocket pour navigateurs -->
        <websocket-listener>
            <port>8884</port>
            <bind-address>0.0.0.0</bind-address>
            <path>/mqtt</path>
            <subprotocols>
                <subprotocol>mqtt</subprotocol>
            </subprotocols>
            <tls>
                <keystore>
                    <path>/opt/hivemq/conf/keystore.jks</path>
                    <password>changeme</password>
                </keystore>
            </tls>
        </websocket-listener>
    </listeners>

    <!-- Sécurité -->
    <security>
        <allow-empty-client-id>
            <enabled>false</enabled>
        </allow-empty-client-id>
    </security>
</hivemq>
```

### 4.4 Laravel comme Subscriber MQTT

**Installation du package :**
```bash
composer require php-mqtt/laravel-client
```

**Configuration `config/mqtt.php` :**
```php
<?php
return [
    'default_connection' => 'hivemq',

    'connections' => [
        'hivemq' => [
            'host'          => env('MQTT_HOST', 'localhost'),
            'port'          => (int) env('MQTT_PORT', 1883),
            'protocol'      => env('MQTT_PROTOCOL', 'tcp'),
            'client_id'     => env('MQTT_CLIENT_ID', 'fuel-api-' . gethostname()),
            'username'      => env('MQTT_USERNAME'),
            'password'      => env('MQTT_PASSWORD'),
            'clean_session' => false,  // Conserver les messages pendant déconnexion
            'logging'       => true,
            'quality_of_service' => 1, // At least once
        ],
    ],
];
```

**Commande Artisan Subscriber :**
```php
<?php
// app/Console/Commands/MqttSubscribeCommand.php

namespace App\Console\Commands;

use App\Models\Tank;
use App\Models\TankLevel;
use App\Services\AlertDetectionService;
use App\Services\DeliveryDetectionService;
use Illuminate\Console\Command;
use PhpMqtt\Client\Facades\MQTT;

class MqttSubscribeCommand extends Command
{
    protected $signature = 'mqtt:subscribe';
    protected $description = 'Subscribe aux topics MQTT FuelIoT pour historiser les données';

    public function __construct(
        private AlertDetectionService $alertService,
        private DeliveryDetectionService $deliveryService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Connexion au broker MQTT...');
        $mqtt = MQTT::connection('hivemq');

        // Subscribe aux niveaux de carburant
        $mqtt->subscribe(
            'fueliot/station/+/tank/+/level',
            function (string $topic, string $message) {
                $this->handleLevelUpdate($topic, $message);
            },
            qualityOfService: 1
        );

        // Subscribe aux alertes des capteurs
        $mqtt->subscribe(
            'fueliot/station/+/tank/+/alert',
            function (string $topic, string $message) {
                $this->handleAlert($topic, $message);
            },
            qualityOfService: 1
        );

        // Subscribe aux statuts de station
        $mqtt->subscribe(
            'fueliot/station/+/status',
            function (string $topic, string $message) {
                $this->handleStationStatus($topic, $message);
            },
            qualityOfService: 1
        );

        $this->info('En écoute sur les topics FuelIoT...');
        $mqtt->loop(true);  // Boucle infinie

        return self::SUCCESS;
    }

    private function handleLevelUpdate(string $topic, string $message): void
    {
        $data = json_decode($message, true);

        // Extraire IDs depuis le topic : fueliot/station/{sid}/tank/{tid}/level
        preg_match('/station\/(\d+)\/tank\/(\d+)/', $topic, $matches);
        $stationId = (int) $matches[1];
        $tankId    = (int) $matches[2];

        // 1. Historiser dans tank_levels
        TankLevel::create([
            'tank_id'     => $tankId,
            'station_id'  => $stationId,
            'level'       => $data['level'],
            'percentage'  => $data['percentage'],
            'temperature' => $data['temperature'] ?? null,
            'recorded_at' => $data['timestamp'] ?? now(),
        ]);

        // 2. Mettre à jour le niveau courant du tank
        $tank = Tank::find($tankId);
        if ($tank) {
            $previousLevel = $tank->current_level;

            $tank->update([
                'current_level' => $data['level'],
                'percentage'    => $data['percentage'],
                'temperature'   => $data['temperature'] ?? $tank->temperature,
            ]);

            // 3. Détecter une livraison automatique
            $this->deliveryService->detectDelivery($tank, $previousLevel, $data['level']);

            // 4. Détecter des alertes (niveau bas, anomalie)
            $this->alertService->checkThresholds($tank, $data);
        }
    }

    private function handleAlert(string $topic, string $message): void
    {
        $data = json_decode($message, true);

        preg_match('/station\/(\d+)\/tank\/(\d+)/', $topic, $matches);

        $this->alertService->createFromSensor([
            'station_id' => (int) $matches[1],
            'tank_id'    => (int) $matches[2],
            'type'       => $data['type'],
            'severity'   => $data['severity'],
            'message'    => $data['message'],
            'details'    => $data['details'] ?? null,
        ]);
    }

    private function handleStationStatus(string $topic, string $message): void
    {
        $data = json_decode($message, true);

        preg_match('/station\/(\d+)/', $topic, $matches);
        $stationId = (int) $matches[1];

        \App\Models\Station::where('id', $stationId)->update([
            'status' => $data['status'],
        ]);
    }
}
```

**Service de Détection de Livraisons :**
```php
<?php
// app/Services/DeliveryDetectionService.php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Tank;

class DeliveryDetectionService
{
    // Seuil identique à celui du frontend (useMqtt.js)
    private const DELIVERY_THRESHOLD = 1000; // litres

    public function detectDelivery(Tank $tank, float $previousLevel, float $newLevel): void
    {
        $difference = $newLevel - $previousLevel;

        if ($difference >= self::DELIVERY_THRESHOLD) {
            Delivery::create([
                'station_id'         => $tank->station_id,
                'tank_id'            => $tank->id,
                'fuel_type'          => $tank->fuel_type,
                'level_before'       => $previousLevel,
                'quantity_delivered'  => $difference,
                'level_after'        => $newLevel,
                'delivery_date'      => now(),
                'delivered_by'       => 'Auto-détecté',
                'driver_name'        => 'N/A',
                'truck_number'       => 'N/A',
                'density'            => $tank->fuel_type === 'essence' ? 0.740 : 0.850,
                'validated'          => false,
            ]);
        }
    }
}
```

**Service de Détection d'Alertes :**
```php
<?php
// app/Services/AlertDetectionService.php

namespace App\Services;

use App\Models\Alert;
use App\Models\Tank;
use App\Models\TankLevel;

class AlertDetectionService
{
    private const LOW_LEVEL_THRESHOLD = 20;      // %
    private const CRITICAL_LEVEL_THRESHOLD = 10;  // %
    private const HIGH_TEMP_THRESHOLD = 35;       // °C
    private const ANOMALY_DROP_THRESHOLD = 500;   // litres en 30 min

    public function checkThresholds(Tank $tank, array $data): void
    {
        $percentage = $data['percentage'];
        $temperature = $data['temperature'] ?? null;

        // Niveau critique
        if ($percentage <= self::CRITICAL_LEVEL_THRESHOLD) {
            $this->createAlert($tank, 'critical_level', 'critical',
                "Niveau critique : {$percentage}% - {$tank->name}");
        }
        // Niveau bas
        elseif ($percentage <= self::LOW_LEVEL_THRESHOLD) {
            $this->createAlert($tank, 'low_level', 'warning',
                "Niveau bas : {$percentage}% - {$tank->name}");
        }

        // Température élevée
        if ($temperature && $temperature >= self::HIGH_TEMP_THRESHOLD) {
            $this->createAlert($tank, 'temperature', 'warning',
                "Température élevée : {$temperature}°C - {$tank->name}");
        }

        // Détection anomalie (baisse rapide = vol potentiel)
        $this->detectAnomaly($tank);
    }

    private function detectAnomaly(Tank $tank): void
    {
        $thirtyMinAgo = now()->subMinutes(30);

        $oldestRecent = TankLevel::where('tank_id', $tank->id)
            ->where('recorded_at', '>=', $thirtyMinAgo)
            ->orderBy('recorded_at')
            ->first();

        if ($oldestRecent) {
            $drop = $oldestRecent->level - $tank->current_level;

            if ($drop >= self::ANOMALY_DROP_THRESHOLD) {
                $this->createAlert($tank, 'anomaly', 'critical',
                    "Baisse anormale de {$drop}L en 30min - {$tank->name}. Vol potentiel.");
            }
        }
    }

    public function createFromSensor(array $data): void
    {
        // Éviter les doublons (même type, même tank, non résolu)
        $exists = Alert::where('tank_id', $data['tank_id'])
            ->where('type', $data['type'])
            ->where('resolved', false)
            ->exists();

        if (! $exists) {
            Alert::create($data);
        }
    }

    private function createAlert(Tank $tank, string $type, string $severity, string $message): void
    {
        $this->createFromSensor([
            'station_id' => $tank->station_id,
            'tank_id'    => $tank->id,
            'type'       => $type,
            'severity'   => $severity,
            'message'    => $message,
        ]);
    }
}
```

### 4.5 Laravel comme Publisher MQTT

```php
<?php
// app/Services/MqttService.php

namespace App\Services;

use PhpMqtt\Client\Facades\MQTT;

class MqttService
{
    /**
     * Envoyer une commande à un capteur
     */
    public function sendCommand(int $stationId, string $command, array $parameters = []): void
    {
        $topic = "fueliot/station/{$stationId}/command";

        $payload = json_encode([
            'command'    => $command,
            'parameters' => $parameters,
            'timestamp'  => now()->toISOString(),
        ]);

        MQTT::publish($topic, $payload, qualityOfService: 1);
    }

    /**
     * Publier une alerte depuis le backend
     */
    public function publishAlert(int $stationId, int $tankId, array $alertData): void
    {
        $topic = "fueliot/station/{$stationId}/tank/{$tankId}/alert";
        MQTT::publish($topic, json_encode($alertData), qualityOfService: 1);
    }
}
```

### 4.6 Vue.js comme Client MQTT

Le frontend se connecte via WebSocket Secure (WSS) au broker. Le composable `useMqtt.js` existant gère cette connexion.

**Configuration côté Vue.js** (`.env`) :
```env
VITE_MQTT_ENABLED=true
VITE_MQTT_HOST=mqtt.fueliot.com        # ou localhost en dev
VITE_MQTT_PORT=8884                     # WSS port
VITE_MQTT_USERNAME=webapp
VITE_MQTT_PASSWORD=secure_password
```

**Flux de données temps réel dans Vue.js :**
```
HiveMQ Broker
    │
    ├─ WSS ──► useMqtt.js (composable)
    │              │
    │              ├─► Parse topic (stationId, tankId)
    │              │
    │              ├─► stationsStore.updateTankLevel()
    │              │       └─► Reactivity → TankCard, CircularGauge, Charts
    │              │
    │              ├─► alertsStore.addAlert()
    │              │       └─► Reactivity → AlertCard, RecentAlerts, Badge
    │              │
    │              └─► deliveriesStore.addDelivery() (auto-détection)
    │                      └─► Reactivity → DeliveryCard, Stats
```

### 4.7 Structure des Topics

```
fueliot/                                    # Racine
├── station/{stationId}/
│   ├── tank/{tankId}/
│   │   ├── level                           # Capteur → Plateforme (QoS 0)
│   │   │   Payload: { level, capacity, percentage, temperature, timestamp }
│   │   │
│   │   ├── temperature                     # Capteur → Plateforme (QoS 0)
│   │   │   Payload: { temperature, unit, timestamp }
│   │   │
│   │   └── alert                           # Capteur → Plateforme (QoS 1)
│   │       Payload: { alertId, type, severity, message, timestamp }
│   │
│   ├── status                              # Capteur → Plateforme (QoS 1)
│   │   Payload: { status, tanksCount, activeTanks, lastUpdate }
│   │
│   └── command                             # Plateforme → Capteur (QoS 1)
│       Payload: { command, tankId, parameters, timestamp }
```

### 4.8 Sécurité MQTT

**ACL HiveMQ (Access Control List) :**

| Utilisateur | Permissions | Topics |
|-------------|-------------|--------|
| `sensor-{id}` | Publish only | `fueliot/station/{sid}/tank/+/#` |
| `webapp` | Subscribe only | `fueliot/#` |
| `api-server` | Subscribe + Publish | `fueliot/#` |
| `admin` | Full access | `#` |

**Extension HiveMQ File Authentication :**
```xml
<file-simple-authentication-extension>
    <credentials>
        <credential>
            <username>webapp</username>
            <password>$2a$12$hashed_password</password>
        </credential>
        <credential>
            <username>api-server</username>
            <password>$2a$12$hashed_password</password>
        </credential>
    </credentials>
</file-simple-authentication-extension>
```

---

## 5. Communication Frontend / Backend / MQTT

### 5.1 REST vs MQTT - Complémentarité

```
┌─────────────────────────────────────────────────────────────┐
│                    STRATÉGIE DE COMMUNICATION                │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│   REST API           │   MQTT                               │
│   (Request/Response) │   (Publish/Subscribe)                │
│                      │                                      │
│   ✓ CRUD complet     │   ✓ Push temps réel                  │
│   ✓ Authentification │   ✓ Latence minimale                 │
│   ✓ Pagination       │   ✓ Événementiel                     │
│   ✓ Filtrage complexe│   ✓ Bidirectionnel                   │
│   ✓ Rapports         │   ✓ Léger (faible bande passante)    │
│   ✓ Export fichiers  │   ✓ QoS garanti                      │
│                      │                                      │
│   Utilisé pour:      │   Utilisé pour:                      │
│   - Login/Logout     │   - Niveaux de cuves                 │
│   - Gestion stations │   - Alertes instantanées             │
│   - Gestion users    │   - Statut stations                  │
│   - Rapports/Export  │   - Température                      │
│   - Livraisons CRUD  │   - Commandes capteurs               │
│   - Résolution alert │   - Détection livraisons auto        │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

### 5.2 Synchronisation des Données

**Stratégie "Fetch + Subscribe" :**

```
Chargement de page (ex: StationDetailView.vue)
│
├── 1. GET /api/v1/stations/{id}         ← État initial (REST)
│       └─► stationsStore.currentStation = response.data
│
├── 2. mqtt.subscribe('fueliot/station/{id}/tank/+/level')  ← Temps réel (MQTT)
│       └─► À chaque message: stationsStore.updateTankLevel()
│
└── 3. onUnmounted()
        └─► mqtt.unsubscribe(...)        ← Nettoyage
```

**Exemple d'implémentation dans un store :**
```javascript
// src/stores/stations.js - Pattern Fetch + Subscribe
export const useStationsStore = defineStore('stations', () => {
  const stations = ref([])
  const API_URL = import.meta.env.VITE_API_URL
  const token = computed(() => useAuthStore().token)

  // 1. Chargement initial via REST
  async function fetchStations() {
    const response = await fetch(`${API_URL}/v1/stations`, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Accept': 'application/json',
      },
    })
    const data = await response.json()
    stations.value = data.data
  }

  // 2. Mise à jour temps réel via MQTT
  function updateTankLevel(stationId, tankId, levelData) {
    const station = stations.value.find(s => s.id === stationId)
    if (!station) return

    const tank = station.tanks.find(t => t.id === tankId)
    if (!tank) return

    tank.level = levelData.level
    tank.percentage = levelData.percentage
    tank.temperature = levelData.temperature ?? tank.temperature
  }

  return { stations, fetchStations, updateTankLevel }
})
```

### 5.3 Diagramme de Séquence - Scénario Complet

```
Capteur IoT          HiveMQ           Laravel API        Vue.js SPA
     │                  │                  │                  │
     │                  │                  │    GET /stations │
     │                  │                  │◄─────────────────│ (1) Fetch initial
     │                  │                  │─────────────────►│ JSON stations[]
     │                  │                  │                  │
     │                  │    SUBSCRIBE     │                  │
     │                  │◄─────────────────│                  │ (2) Laravel subscribe
     │                  │                  │                  │
     │                  │         SUBSCRIBE (WSS)             │
     │                  │◄────────────────────────────────────│ (3) Vue.js subscribe
     │                  │                  │                  │
     │  PUBLISH level   │                  │                  │
     │─────────────────►│                  │                  │ (4) Capteur publie
     │                  │                  │                  │
     │                  │  MESSAGE level   │                  │
     │                  │─────────────────►│                  │ (5) Laravel reçoit
     │                  │                  │──► INSERT        │     → Historise
     │                  │                  │    tank_levels   │     → Détecte alertes
     │                  │                  │                  │
     │                  │         MESSAGE level (WSS)         │
     │                  │────────────────────────────────────►│ (6) Vue.js reçoit
     │                  │                  │                  │──► updateTankLevel()
     │                  │                  │                  │──► Reactivity → UI
     │                  │                  │                  │
     │                  │                  │  [Si anomalie]   │
     │                  │                  │──► CREATE alert  │
     │                  │  PUBLISH alert   │                  │
     │                  │◄─────────────────│                  │ (7) Laravel publie alerte
     │                  │                  │                  │
     │                  │         MESSAGE alert (WSS)         │
     │                  │────────────────────────────────────►│ (8) Vue.js affiche toast
     │                  │                  │                  │
```

### 5.4 Stratégies de Reconnexion et Tolérance aux Pannes

**MQTT - Reconnexion automatique :**
```javascript
// Configuration dans mqttService.js
const options = {
  reconnectPeriod: 5000,      // Retry toutes les 5 secondes
  connectTimeout: 30000,      // Timeout connexion 30s
  keepalive: 60,              // Keepalive 60s
  clean: false,               // Conserver les messages pendant déconnexion
  // Avec clean: false, HiveMQ stocke les messages QoS 1/2
  // et les renvoie à la reconnexion
}
```

**Fallback REST si MQTT indisponible :**
```javascript
// Dans useMqtt.js - Polling REST comme fallback
let pollingInterval = null

function startRestPolling() {
  pollingInterval = setInterval(async () => {
    const stationsStore = useStationsStore()
    await stationsStore.fetchStations()    // Refresh via REST

    const alertsStore = useAlertsStore()
    await alertsStore.fetchAlerts()        // Refresh alertes
  }, 10000)  // Toutes les 10 secondes
}

function onMqttDisconnect() {
  if (!pollingInterval) {
    console.warn('MQTT déconnecté, basculement vers polling REST')
    startRestPolling()
  }
}

function onMqttReconnect() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
    console.info('MQTT reconnecté, arrêt du polling REST')
  }
}
```

**HiveMQ - Persistance des messages :**
- `Clean Session = false` : le broker conserve les souscriptions et les messages QoS 1/2 en attente
- `Retained Messages` : le dernier message de chaque topic est conservé pour les nouveaux abonnés
- `Message Queue` : HiveMQ stocke jusqu'à 1000 messages par client déconnecté (configurable)

---

## 6. Sécurité

### 6.1 Sécurisation des Endpoints API

**Laravel Sanctum :**
```php
// Chaque requête authentifiée inclut le header :
// Authorization: Bearer {token}

// Token avec expiration (config/sanctum.php)
'expiration' => 60 * 24, // 24 heures
```

**Rate Limiting :**
```php
// bootstrap/app.php
use Illuminate\Cache\RateLimiting\Limit;

RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

// Limite spécifique pour login (protection brute force)
RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip());
});
```

### 6.2 Configuration CORS

```php
<?php
// config/cors.php

return [
    'paths'                => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'      => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allowed_origins'      => [
        env('FRONTEND_URL', 'http://localhost:5173'),  // Dev Vue.js
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers'      => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    'exposed_headers'      => [],
    'max_age'              => 86400,  // 24h cache preflight
    'supports_credentials' => true,
];
```

### 6.3 Protection CSRF

Avec Sanctum en mode token-based (pas cookie-based), la protection CSRF n'est pas nécessaire car chaque requête porte un token Bearer dans le header Authorization. Le CSRF est pertinent uniquement en mode cookie/session.

Si vous optez pour le mode SPA cookie-based de Sanctum :
```javascript
// Avant le login, récupérer le cookie CSRF
await fetch(`${API_URL}/sanctum/csrf-cookie`, {
  credentials: 'include',
})
```

### 6.4 Sécurisation MQTT

| Couche | Mesure | Configuration |
|--------|--------|---------------|
| **Transport** | TLS/SSL (WSS) | Port 8884 avec certificats |
| **Authentification** | Username/Password | Extension HiveMQ file-auth |
| **Autorisation** | ACL par topic | Read/Write par rôle |
| **Client ID** | Unique par client | `fuel-iot-{type}-{id}` |
| **Payload** | Validation JSON | Schéma strict côté subscriber |

**Certificats TLS :**
```bash
# Générer un certificat auto-signé (dev)
keytool -genkeypair -alias hivemq \
  -keyalg RSA -keysize 2048 \
  -keystore /opt/hivemq/conf/keystore.jks \
  -storepass changeme \
  -dname "CN=mqtt.fueliot.com"

# Production : utiliser Let's Encrypt ou certificat commercial
```

### 6.5 Bonnes Pratiques Générales

```
┌────────────────────────────────────────────────┐
│            CHECKLIST SÉCURITÉ                   │
├────────────────────────────────────────────────┤
│ ✓ HTTPS obligatoire (API + Frontend)           │
│ ✓ WSS obligatoire (MQTT WebSocket)             │
│ ✓ Tokens Sanctum avec expiration               │
│ ✓ Rate limiting sur tous les endpoints         │
│ ✓ Validation côté serveur (Form Requests)      │
│ ✓ Eloquent ORM (protection SQL injection)      │
│ ✓ CORS restreint aux origines autorisées       │
│ ✓ Mots de passe hashés (bcrypt)                │
│ ✓ ACL MQTT par rôle                            │
│ ✓ Logs d'accès et d'audit                      │
│ ✓ Headers de sécurité HTTP                     │
│ ✓ Pas de données sensibles en localStorage     │
│   (considérer httpOnly cookies en production)  │
└────────────────────────────────────────────────┘
```

**Headers de sécurité (Middleware Laravel) :**
```php
<?php
// app/Http/Middleware/SecurityHeaders.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        return $response;
    }
}
```

---

## 7. Déploiement & Environnement

### 7.1 Variables d'Environnement Laravel

```env
# .env (Laravel Backend)

APP_NAME=FuelIoT-API
APP_ENV=production
APP_KEY=base64:xxxxx
APP_DEBUG=false
APP_URL=https://api.fueliot.com

# PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fueliot
DB_USERNAME=fueliot_app
DB_PASSWORD=secure_password

# Redis (Cache + Queue)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:5173,fueliot.com
FRONTEND_URL=https://fueliot.com

# MQTT (HiveMQ)
MQTT_HOST=mqtt.fueliot.com
MQTT_PORT=1883
MQTT_USERNAME=api-server
MQTT_PASSWORD=secure_mqtt_password
MQTT_CLIENT_ID=fuel-api-server

# Logging
LOG_CHANNEL=daily
LOG_LEVEL=info
```

### 7.2 Variables d'Environnement Vue.js

```env
# .env (Vue.js Frontend)

# API Backend
VITE_API_URL=https://api.fueliot.com/api

# MQTT
VITE_MQTT_ENABLED=true
VITE_MQTT_HOST=mqtt.fueliot.com
VITE_MQTT_PORT=8884
VITE_MQTT_USERNAME=webapp
VITE_MQTT_PASSWORD=secure_webapp_password
```

### 7.3 Configuration PostgreSQL

```ini
# postgresql.conf - Optimisations production

# Connexions
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 8MB

# WAL (Write-Ahead Logging)
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Autovacuum (critique pour tank_levels)
autovacuum_vacuum_scale_factor = 0.05
autovacuum_analyze_scale_factor = 0.02

# Logging
log_min_duration_statement = 200    # Log requêtes > 200ms
log_statement = 'none'
log_line_prefix = '%t [%p] %u@%d '
```

### 7.4 Environnements

| Paramètre | Dev (Laragon) | Staging | Production |
|-----------|---------------|---------|------------|
| API URL | `http://localhost:8000/api` | `https://staging-api.fueliot.com/api` | `https://api.fueliot.com/api` |
| Frontend URL | `http://localhost:5173` | `https://staging.fueliot.com` | `https://fueliot.com` |
| MQTT Broker | `localhost:1883` | `staging-mqtt:1883` | `mqtt.fueliot.com:8883` (TLS) |
| MQTT WS | `ws://localhost:9001` | `wss://staging-mqtt:8884` | `wss://mqtt.fueliot.com:8884` |
| PostgreSQL | `localhost:5432` | Docker service | Managed (AWS RDS / DO) |
| Redis | `localhost:6379` | Docker service | Managed (ElastiCache) |
| Debug | `true` | `true` | `false` |
| Log Level | `debug` | `debug` | `info` |

### 7.5 Docker Compose (Environnement Complet)

```yaml
# docker-compose.yml

version: '3.8'

services:
  # Backend Laravel
  api:
    build:
      context: ./fuel-api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - MQTT_HOST=hivemq
    depends_on:
      - postgres
      - redis
      - hivemq
    volumes:
      - ./fuel-api:/var/www/html
    networks:
      - fueliot

  # Worker Queue (Jobs Laravel)
  worker:
    build:
      context: ./fuel-api
      dockerfile: Dockerfile
    command: php artisan queue:work redis --tries=3
    depends_on:
      - api
    networks:
      - fueliot

  # MQTT Subscriber (Process Laravel)
  mqtt-subscriber:
    build:
      context: ./fuel-api
      dockerfile: Dockerfile
    command: php artisan mqtt:subscribe
    depends_on:
      - api
      - hivemq
    restart: unless-stopped
    networks:
      - fueliot

  # Frontend Vue.js
  frontend:
    build:
      context: ./fuel-front
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - api
    networks:
      - fueliot

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: fueliot
      POSTGRES_USER: fueliot_app
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - fueliot

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    networks:
      - fueliot

  # HiveMQ Broker
  hivemq:
    image: hivemq/hivemq4
    ports:
      - "1883:1883"     # MQTT
      - "8883:8883"     # MQTT + TLS
      - "8080:8080"     # Dashboard admin
      - "8884:8884"     # WebSocket Secure
    volumes:
      - hivemq-data:/opt/hivemq/data
      - ./hivemq/config.xml:/opt/hivemq/conf/config.xml
    networks:
      - fueliot

volumes:
  pgdata:
  redisdata:
  hivemq-data:

networks:
  fueliot:
    driver: bridge
```

---

## 8. Bonnes Pratiques & Recommandations

### 8.1 Optimisations

**Cache Redis :**
```php
// Cacher les stations (rarement modifiées)
public function index()
{
    $stations = Cache::remember('stations:all', 300, function () {
        return Station::with('tanks')->get();
    });

    return StationResource::collection($stations);
}

// Invalider le cache lors de modifications
public function update(UpdateStationRequest $request, Station $station)
{
    $station->update($request->validated());
    Cache::forget('stations:all');
    Cache::forget("stations:{$station->id}");
}
```

**Jobs Asynchrones :**
```php
// Historiser les données MQTT en background
// Au lieu d'écrire directement dans handleLevelUpdate()
dispatch(new ProcessTankLevel($tankId, $stationId, $data));
```

**Pagination systématique :**
Tous les endpoints de liste utilisent la pagination Laravel (défaut 20 items/page).

### 8.2 Scalabilité

| Composant | Stratégie de scaling |
|-----------|---------------------|
| **Laravel API** | Horizontal (load balancer + N instances) |
| **MQTT Subscriber** | Un seul process (ou consumer group) |
| **HiveMQ** | Clustering natif (2+ nœuds) |
| **PostgreSQL** | Read replicas pour rapports, primary pour writes |
| **Redis** | Sentinel ou Cluster pour HA |
| **Frontend** | CDN (assets statiques) |

**Architecture cible production :**
```
                    ┌── API Instance 1 ──┐
Client ──► LB ────►├── API Instance 2 ──├──► PostgreSQL Primary
                    └── API Instance 3 ──┘       │
                                                  ▼
                                          PostgreSQL Replica
                                          (pour rapports)

MQTT Subscriber ──► HiveMQ Cluster ◄── Capteurs IoT
     │               (2+ nœuds)
     ▼
PostgreSQL (tank_levels)
```

### 8.3 Maintenabilité

**Versioning API :**
- Préfixe `/api/v1/` pour toutes les routes
- Lors de changements breaking, créer `/api/v2/` et maintenir v1 en parallèle
- Dépréciation progressive avec header `Deprecation: true`

**Tests :**
```bash
# Tests unitaires (Models, Services)
php artisan test --testsuite=Unit

# Tests fonctionnels (API endpoints)
php artisan test --testsuite=Feature

# Exemple de test fonctionnel
php artisan make:test StationControllerTest
```

```php
// tests/Feature/StationControllerTest.php
public function test_authenticated_user_can_list_stations(): void
{
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)
        ->getJson('/api/v1/stations');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [['id', 'name', 'address', 'location', 'status', 'tanks']],
            'meta' => ['current_page', 'last_page', 'total'],
        ]);
}

public function test_unauthenticated_user_cannot_access_stations(): void
{
    $response = $this->getJson('/api/v1/stations');
    $response->assertUnauthorized();
}
```

**CI/CD Pipeline :**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: fueliot_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']

    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
      - run: composer install --no-interaction
      - run: cp .env.testing .env
      - run: php artisan migrate --seed
      - run: php artisan test
```

### 8.4 Monitoring et Logs

**Laravel Telescope (dev/staging) :**
```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

**Logs structurés (production) :**
```php
// Logging des actions critiques
Log::channel('daily')->info('Alerte créée', [
    'alert_id'   => $alert->id,
    'type'       => $alert->type,
    'severity'   => $alert->severity,
    'station_id' => $alert->station_id,
    'tank_id'    => $alert->tank_id,
]);

Log::channel('daily')->info('Livraison détectée automatiquement', [
    'tank_id'           => $tank->id,
    'previous_level'    => $previousLevel,
    'new_level'         => $newLevel,
    'quantity_detected' => $newLevel - $previousLevel,
]);
```

**Health Check Endpoint :**
```php
// routes/api.php
Route::get('/health', function () {
    return response()->json([
        'status'   => 'ok',
        'database' => DB::connection()->getPdo() ? 'connected' : 'error',
        'redis'    => Redis::ping() ? 'connected' : 'error',
        'time'     => now()->toISOString(),
    ]);
});
```

**Métriques à surveiller :**

| Métrique | Source | Seuil d'alerte |
|----------|--------|----------------|
| Temps de réponse API | Laravel logs | > 500ms |
| Erreurs 5xx | Logs / monitoring | > 1% des requêtes |
| Connexions MQTT actives | HiveMQ dashboard | < expected clients |
| Messages MQTT/sec | HiveMQ metrics | < 1/min par capteur |
| CPU/RAM PostgreSQL | Système | > 80% |
| Taille `tank_levels` | PostgreSQL | Vérifier partitionnement |
| Queue jobs pending | Redis / Horizon | > 100 jobs en attente |
| Latence MQTT | Application | > 2 secondes |

---

## Annexe : Service HTTP Utilitaire pour Vue.js

Pour centraliser les appels API dans le frontend, créer un service HTTP :

```javascript
// src/services/api.js

const API_URL = import.meta.env.VITE_API_URL

class ApiService {
  constructor() {
    this.baseURL = API_URL
  }

  get token() {
    return localStorage.getItem('token')
  }

  get headers() {
    const h = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (this.token) {
      h['Authorization'] = `Bearer ${this.token}`
    }
    return h
  }

  async request(method, path, body = null) {
    const options = {
      method,
      headers: this.headers,
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${this.baseURL}${path}`, options)

    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Session expirée')
    }

    if (!response.ok) {
      const error = await response.json()
      throw { status: response.status, ...error }
    }

    if (response.status === 204) return null
    return response.json()
  }

  get(path)          { return this.request('GET', path) }
  post(path, body)   { return this.request('POST', path, body) }
  put(path, body)    { return this.request('PUT', path, body) }
  delete(path)       { return this.request('DELETE', path) }
}

export const api = new ApiService()
```

**Usage dans les stores :**
```javascript
import { api } from '@/services/api'

// Dans useStationsStore
async function fetchStations() {
  const data = await api.get('/v1/stations')
  stations.value = data.data
}

async function createStation(stationData) {
  const data = await api.post('/v1/stations', stationData)
  stations.value.push(data.data)
}
```

---

> **Document généré à partir de l'analyse complète du frontend Vue.js FuelIoT.**
> Fichiers de référence : `src/stores/`, `src/hooks/useMqtt.js`, `src/services/mqttService.js`, `src/router/index.js`, `MQTT_INTEGRATION.md`
