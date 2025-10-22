# 🌊 TideME API

Backend Next.js pour l'application mobile TideME - Données de marées, météo et surf en temps réel.

## 🎯 Fonctionnalités

- ✅ **Cache intelligent** : Redis avec TTL 6h
- ✅ **Temps réel** : Calculs d'interpolation sinusoïdale pour hauteur d'eau
- ✅ **Cronjob automatique** : Pré-chargement toutes les 6h (02h, 08h, 14h, 20h UTC)
- ✅ **30+ ports français** : Bretagne, Atlantique, Vendée
- ✅ **Données complètes** : Marées, météo, surf, astronomie

## 🏗️ Architecture

```
app/
├── api/
│   ├── tides/        → Endpoint principal (POST)
│   ├── ports/        → Liste des ports (GET)
│   └── cron/
│       └── refresh/  → Cronjob pré-chargement (GET)
lib/
├── cache.ts          → Client Upstash Redis
├── stormglass.ts     → Appels API StormGlass
├── tideCalculator.ts → Calculs temps réel marées
├── astreCalculator.ts → Calculs soleil/lune
└── constants.ts      → Configuration
```

## 🚀 Installation

### 1. Cloner et installer

```bash
cd tideme-api
npm install
```

### 2. Configurer les variables d'environnement

Copier `.env.local` et remplir :

```bash
# StormGlass API
STORMGLASS_API_KEY=your-api-key-here

# Upstash Redis (get from https://console.upstash.com)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Vercel Cron Secret
CRON_SECRET=random-secret-string
```

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
    "coefficient": 87,
    "maxTide": { "time": "...", "height": 5.2, "type": "high" },
    "minTide": { "time": "...", "height": 1.8, "type": "low" },
    "currentHeight": 3.45,
    "waterLevel": 0.62
  },
  "nextTide": {
    "type": "low",
    "time": "...",
    "height": 1.8,
    "timeUntil": "3h15",
    "status": "falling"
  },
  "weather": { ... },
  "surf": { ... },
  "sun": { "sunrise": "07:30", "sunset": "19:45" },
  "moon": { "phase": "full", "illumination": 0.98 },
  "isDay": true
}
```

### GET /api/ports

Liste tous les ports disponibles.

**Response:**
```json
{
  "ports": [...],
  "count": 30
}
```

## ⚡ Performance

### Économie API

| Scénario | Calls/jour | Coût |
|----------|------------|------|
| Sans cache (1000 users) | 5000+ | 49€/mois |
| **Avec cache** (1000 users) | **120** | **19€/mois** |

**Économie : 98% de réduction des API calls !**

### Cache Hit Rate

Objectif : > 95% de cache hit rate

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

### 3. Setup Upstash Redis

1. Créer compte sur [console.upstash.com](https://console.upstash.com)
2. Créer une database Redis
3. Copier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
4. Intégrer avec Vercel

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

## 📝 TODO

- [ ] Tests unitaires (Jest)
- [ ] Tests d'intégration
- [ ] Monitoring Sentry
- [ ] Rate limiting
- [ ] API authentication (JWT)
- [ ] Webhooks pour notifications

## 📄 License

MIT

## 🤝 Contributing

Pull requests welcome!

---

Made with ❤️ for surfers and sailors
