# Analyse des Amplitudes - Ports Français (30/10/2025)

## 📊 Données collectées (15 ports)

| Port | Amplitude Moy | Coef calculé (×20) | Note |
|------|---------------|-------------------|------|
| **Dieppe** | 2.784m | 56 | Manche |
| **Saint-Malo** | 2.775m | 56 | Bretagne Nord |
| **Boulogne** | 2.666m | 53 | Manche |
| **Calais** | 2.304m | 46 | Manche |
| **Le Havre** | 2.195m | 44 | Manche |
| **Dunkerque** | 1.981m | 40 | Mer du Nord |
| **Brest** | 1.610m | 32 | Bretagne Ouest |
| **La Rochelle** | 1.450m | 29 | Atlantique |
| **Cherbourg** | 1.407m | 28 | Manche |
| **Royan** | 1.254m | 25 | Atlantique |
| **Le Crouesty** | 1.225m | 25 | Bretagne Sud |
| **Arcachon** | 1.165m | 23 | Atlantique |
| **Saint-Jean-de-Luz** | 1.086m | 22 | Atlantique |
| **Biarritz** | 0.994m | 20 | Atlantique |
| **Marseille** | 0.054m | 1 | ⚠️ **ABERRATION** |

## 🚫 Aberrations détectées

**Marseille: 0.054m** → Méditerranée (micro-marées, quasi inexistantes)
- Coefficient réel: 31 (SHOM universel)
- Coefficient calculé (×20): 1
- **ERREUR: -30 points !** 😱

→ **EXIT Marseille** des calculs (mer fermée, pas de vraie marée océanique)

## ✅ Statistiques après filtrage

**14 ports retenus (ports océaniques uniquement)**

- **Moyenne**: 1.779m
- **Médiane**: 1.528m
- **Min**: 0.994m (Biarritz)
- **Max**: 2.784m (Dieppe)
- **Écart-type**: ~0.63m

## 🎯 Observation CRITIQUE

**LE COEFFICIENT NE SUIT PAS L'AMPLITUDE LOCALE !**

Tous ces ports ont le **même coefficient réel = 31** aujourd'hui (SHOM).

**Exemples:**
- Dieppe: 2.78m → Coef calculé 56 ❌ Réel: 31
- Biarritz: 0.99m → Coef calculé 20 ❌ Réel: 31
- Dunkerque: 1.98m → Coef calculé 40 ❌ Réel: 31

**Conclusion:** Le coefficient est **UNIVERSEL pour toute la France** et est calculé sur la base de **Brest (port de référence)**.

## 💡 Formule améliorée

Puisqu'on ne peut pas calculer le vrai coefficient sans référence Brest, on va utiliser une **approximation intelligente** basée sur l'amplitude moyenne française:

```typescript
// Formule calibrée
const AMPLITUDE_MOYENNE_FRANCE = 1.78; // Moyenne océanique
const COEF_MOYEN = 70; // Coefficient moyen annuel

function calculateCoefficientEstimate(amplitude: number): number {
  // Normaliser par rapport à la moyenne
  const ratio = amplitude / AMPLITUDE_MOYENNE_FRANCE;

  // Appliquer le ratio au coefficient moyen
  const coef = Math.round(ratio * COEF_MOYEN);

  // Clamper entre 20-120
  return Math.max(20, Math.min(120, coef));
}
```

**Tests:**
- 1.0m → (1.0/1.78)×70 = **39**
- 1.5m → (1.5/1.78)×70 = **59**
- 2.0m → (2.0/1.78)×70 = **79**
- 2.5m → (2.5/1.78)×70 = **98**

**Toujours imprécis, mais plus cohérent !**

## 🔄 Détection phase montante/descendante

Pour détecter si on est en phase montante ou descendante:

```typescript
// Comparer amplitudes J vs J+1
const amp1 = maxTide1.height - minTide1.height;
const amp2 = maxTide2.height - minTide2.height;

const isRisingPhase = amp2 > amp1; // true = montante, false = descendante
```

**Aujourd'hui (30/10):**
- Brest: 1.97m → 2.30m (demain) → **MONTANTE** ✅
- Coefficient: 31 → 38 → **MONTANTE** ✅

## ⚠️ Recommandation finale

**Option 1:** Afficher avec disclaimer
```
Coefficient: ~39 (estimé*)
*Approximation basée sur amplitude locale
Source officielle: maree.info
```

**Option 2:** Demander autorisation maree.info pour scraping 1x/jour

**Option 3:** Ne plus afficher de coefficient (honnêteté)
