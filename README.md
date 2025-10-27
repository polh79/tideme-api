# 🌊 TideME API

API backend centralisée pour l'application mobile **TideME** - Données de marées en temps réel pour les ports français.

## 📋 Vue d'ensemble

TideME API est un backend Next.js qui :
- Récupère les données de marées depuis **StormGlass API**
- Calcule les informations en temps réel (hauteur actuelle, coefficient, etc.)
- Cache intelligent (12h) pour optimiser les appels API
- Pré-charge automatiquement les 3 ports toutes les 12h via cron job
- **Économie** : ~6 API calls/jour au lieu de plusieurs centaines

## 🎯 Fonctionnalités

- ✅ **Cache intelligent** : Upstash Redis ou cache mémoire (TTL 12h)
- ✅ **Temps réel** : Calculs d'interpolation sinusoïdale pour hauteur d'eau
- ✅ **Cronjob automatique** : Pré-chargement toutes les 12h (02h, 14h UTC)
- ✅ **3 ports** : Dunkerque, Le Crouesty, Biarritz (mode dev)
- ✅ **Données marées** : Extremes, coefficient, hauteur actuelle, direction

## 🏗️ Architecture

```
app/
├── api/
│   ├── tides/        → Endpoint principal (POST)
│   ├── ports/        → Liste des ports (GET)
│   └── cron/
│       └── refresh/  → Cronjob pré-chargement (GET)
lib/
├── cache.ts          → Cache hybride (Upstash ou mémoire)
├── memoryCache.ts    → Cache en mémoire avec TTL
├── stormglass.ts     → Appels API StormGlass (marées uniquement)
├── tideCalculator.ts → Calculs temps réel marées
└── constants.ts      → Configuration
```

## 🚀 Installation

### 1. Cloner et installer

```bash
cd tideme-api
npm install
```

### 2. Configurer les variables d'environnement

Copier `.env.example` en `.env.local` et remplir :

```bash
# OBLIGATOIRE
STORMGLASS_API_KEY=your-api-key-here
CRON_SECRET=random-secret-string

# OPTIONNEL (utilise cache mémoire si absent)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Obtenir une clé StormGlass :**
1. Créer un compte sur https://stormglass.io
2. Plan gratuit : 10 calls/jour (suffisant pour 3 ports)
3. Copier la clé API

### 3. Lancer en développement

```bash
npm run dev
```

API disponible sur : http://localhost:3000

## 📡 Endpoints

### POST /api/tides

Récupère toutes les données pour un port.

**Request:**
```json
{
  "portId": "le-crouesty"
}
```

**Response:**
```json
{
  "meta": {
    "cacheHit": true,
    "timestamp": "2025-10-22T14:30:00Z",
    "apiCallsUsed": 0
  },
  "port": {
    "id": "le-crouesty",
    "name": "Le Crouesty",
    "latitude": 47.5447,
    "longitude": -2.9042
  },
  "tide": {
    "extremes": [...],  // Tous les extremes sur 48h
    "maxTide": { "time": "...", "height": 5.2, "type": "high" },
    "minTide": { "time": "...", "height": 1.8, "type": "low" },
    "currentHeight": 3.45,
    "coefficient": 87,
    "isRising": true,
    "waterLevel": 0.62
  }
}
```

### GET /api/ports

Liste tous les ports disponibles.

**Response:**
```json
{
  "ports": [
    {
      "id": "dunkerque",
      "name": "Dunkerque",
      "latitude": 51.0343,
      "longitude": 2.3768,
      "region": "Hauts-de-France",
      "department": "Nord",
      "emoji": "⚓"
    },
    ...
  ]
}
```

## ⚡ Performance & Économie

### Scénario : 100 utilisateurs

**Sans API centralisée (avant) :**
- 100 users × 1 call/jour minimum = **100+ calls/jour** ❌
- Dépasse largement le quota gratuit (10 calls/jour)

**Avec tideme-api (après) :**
- Cron refresh : 3 ports × 2 fois/jour = **6 calls/jour** ✅
- 100 users × 5 ouvertures = 500 requêtes → **0 calls supplémentaires** (cache!)
- **Total : 6 calls/jour** peu importe le nombre d'utilisateurs

**Économie : 94%+** 🎉

### Cache Hit Rate

Objectif : > 99% de cache hit rate

## 🔧 Développement

### Tester un endpoint

```bash
curl -X POST http://localhost:3000/api/tides \
  -H "Content-Type: application/json" \
  -d '{"portId": "le-crouesty"}'
```

### Tester le cronjob (local)

```bash
curl http://localhost:3000/api/cron/refresh \
  -H "Authorization: Bearer your-cron-secret"
```

## 🚢 Déploiement sur Vercel

### 1. Push sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourname/tideme-api.git
git push -u origin main
```

### 2. Connecter à Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Import Git Repository
3. Sélectionner `tideme-api`
4. Configurer les variables d'environnement :
   - `STORMGLASS_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `CRON_SECRET`
5. Deploy !

### 3. Setup Upstash Redis (optionnel)

**L'API fonctionne sans Upstash** (utilise le cache mémoire). Pour la production :

1. Créer compte gratuit sur [console.upstash.com](https://console.upstash.com)
2. Créer une database Redis
3. Copier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
4. Ajouter à Vercel Environment Variables
5. Redéployer

**Avantages :**
- Cache persistant (survit aux redémarrages)
- Partagé entre toutes les instances
- Gratuit jusqu'à 10 000 commandes/jour

## 📊 Monitoring

### Vercel Dashboard

- Cache hit rate
- API latency (p50, p95, p99)
- Error rate
- Bandwidth usage

### Upstash Dashboard

- Redis operations/day
- Memory usage
- Cache keys

## 🧪 Tests

```bash
# Tester l'interpolation des marées
npm test
```

## 🗂️ Ports disponibles

| Port | ID | Région | Emoji |
|------|----|---------| ----- |
| Dunkerque | `dunkerque` | Hauts-de-France | ⚓ |
| Le Crouesty | `le-crouesty` | Bretagne | ⛵ |
| Biarritz | `biarritz` | Pays Basque | 🏄 |

## 📝 TODO

- [ ] Tests unitaires (Jest)
- [ ] Ajouter plus de ports (actuellement 3 en mode dev)
- [ ] Monitoring Sentry
- [ ] Rate limiting
- [ ] Intégration météo/surf (Open-Meteo)

## 📄 License

MIT

## 🤝 Contributing

Pull requests welcome!

---

Made with ❤️ for surfers and sailors
