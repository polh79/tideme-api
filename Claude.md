# TideME API - Documentation

## 🎯 Objectif

API backend centralisée pour récupérer et redistribuer les données de marées à l'application mobile TideMe (`H:\WorkFlow\tideme`).

## 📊 Configuration DEV

**Défis :** 10 CALLS/JOUR pour 3 PORTS (StormGlass gratuit)

**Solution :**
- Cache intelligent 12h (Upstash ou mémoire)
- Refresh automatique toutes les 12h via cron
- **6 calls/jour maximum** (3 ports × 2 refresh/jour)

## 🏗️ Architecture simplifiée

### Données récupérées
- ✅ **Marées uniquement** (StormGlass Tide API)
- ❌ Pas de météo/surf (économie de 50% des calls API)

### Flux de données
```
Vercel Cron (12h)
  → /api/cron/refresh
  → Fetche 3 ports StormGlass
  → Cache 12h
  → App TideMe consomme le cache (0 calls)
```

### Calculs temps réel (toujours frais)
- Hauteur d'eau actuelle (interpolation sinusoïdale)
- Coefficient de marée (20-120)
- Marée montante/descendante
- Niveau normalisé pour animation UI

## 🗂️ Ports en développement

| Port | ID | Région | Emoji |
|------|----|---------| ----- |
| Dunkerque | `dunkerque` | Hauts-de-France | ⚓ |
| Le Crouesty | `le-crouesty` | Bretagne | ⛵ |
| Biarritz | `biarritz` | Pays Basque | 🏄 |

## 📡 Endpoints

### POST /api/tides
Récupère les données de marées pour un port.

**Input:** `{ portId: "biarritz" }`

**Output:**
```json
{
  "meta": {
    "cacheHit": true,
    "apiCallsUsed": 0
  },
  "port": { ... },
  "tide": {
    "extremes": [...],
    "maxTide": { ... },
    "minTide": { ... },
    "currentHeight": 2.85,
    "coefficient": 78,
    "isRising": true,
    "waterLevel": 0.58
  }
}
```

### GET /api/ports
Liste des 3 ports disponibles.

### GET /api/cron/refresh
Cron interne (Bearer token requis).

## 💾 Cache

### Système hybride
- **Upstash configuré** → Redis persistant (recommandé prod)
- **Upstash absent** → Cache mémoire (OK pour dev)

### Configuration
- **TTL:** 12 heures
- **Refresh:** 2h et 14h UTC (toutes les 12h)
- **Clés:** `port:{portId}:tides`

## 🚀 Déploiement Vercel

### Variables requises
```bash
STORMGLASS_API_KEY=xxx    # OBLIGATOIRE
CRON_SECRET=xxx           # OBLIGATOIRE
UPSTASH_REDIS_REST_URL=   # OPTIONNEL
UPSTASH_REDIS_REST_TOKEN= # OPTIONNEL
```

### Steps
1. Vercel → Import `polh79/tideme-api`
2. Configurer les variables d'environnement
3. Deploy → URL générée
4. Dashboard visible à la racine `/`

## 📈 Monitoring

Dashboard disponible à `/` avec :
- Voyants vert/rouge par port
- Coefficient, hauteur actuelle
- Prochaines marées haute/basse
- Direction montante/descendante
- JSON complet

## 🔄 Intégration avec TideMe

L'app TideMe devra modifier `utils/service/stormGlassService.ts` pour appeler :
```typescript
POST https://tideme-api.vercel.app/api/tides
Body: { portId: "biarritz" }
```

Au lieu d'appeler StormGlass directement.

## 📊 Économie

- **Avant:** Chaque user = 1+ call/jour
- **Après:** 6 calls/jour partagés par TOUS les users
- **Capacité:** Supporte des dizaines d'users avec 10 calls/jour gratuits