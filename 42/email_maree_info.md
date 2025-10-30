# Email à maree.info

**À:** webmaster@frbateaux.net
**Objet:** Demande d'utilisation ponctuelle pour validation de calculs de marées

---

Bonjour,

Je développe actuellement une application mobile de prévision pour les activités nautiques (surf notamment).

Pour les horaires et hauteurs des marées, j'utilise une API internationale (WorldTides) qui fournit des données précises. Cependant, celle-ci ne fournit pas les **coefficients de marée français**, qui sont essentiels pour les utilisateurs pratiquant des sports nautiques en France.

De mon côté, j'ai mis en place un **système de calcul des coefficients** basé sur l'amplitude des marées et une calibration sur 14 ports océaniques français. J'aimerais pouvoir **comparer mes résultats calculés avec les coefficients officiels du SHOM** pour valider la précision de mon algorithme.

Serait-il envisageable d'effectuer **une requête automatisée quotidienne** sur votre site (port de Brest uniquement, port de référence français) afin de récupérer les coefficients officiels et les comparer avec mes calculs ?

**Mes engagements :**
- Strictement **1 requête par jour** (dans un CRON nocturne)
- Affichage clair de la source : "Coefficients: SHOM via maree.info"
- Lien direct vers votre site pour les utilisateurs souhaitant plus d'informations
- **Usage non commercial** (projet personnel)
- Respect total de vos serveurs (pas de charge)

Je comprends parfaitement que votre site ne soit pas conçu comme une API, et c'est la raison pour laquelle je vous contacte directement. L'accès à l'API officielle du SHOM (environ 900€/an) dépasse largement le budget d'un projet personnel comme celui-ci.

**Alternative :** Si vous préférez, je peux également me contenter d'afficher uniquement mes coefficients calculés avec un disclaimer explicite indiquant qu'il s'agit d'estimations et en renvoyant vers votre site pour les données officielles.

Je reste à votre entière disposition pour discuter d'une éventuelle collaboration ou d'une alternative qui conviendrait mieux à votre politique d'usage.

En vous remerciant par avance pour votre attention,

Cordialement,

[Votre nom]
[Votre email]

---

## Annexe : Détails techniques

**Port de référence ciblé :** Brest (82)
**Fréquence :** 1 requête/jour (vers 3h du matin UTC)
**Données extraites :** Coefficients des 7 prochains jours
**Stockage :** Cache Redis (12h) côté serveur
**Attribution :** Affichage visible dans l'application

**Exemple d'affichage dans l'app :**
```
Coefficient: 31
Source: SHOM via maree.info
[Lien vers maree.info/82]
```
