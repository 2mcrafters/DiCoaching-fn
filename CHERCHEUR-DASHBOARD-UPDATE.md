# 🔄 Mise à Jour Dashboard Chercheur - Documentation

## 📊 Modifications Apportées

### Pour le rôle **Chercheur (Researcher)**

#### ❌ **Supprimé:**
1. **"Documents de Recherche"** - Carte et onglet retirés
2. **"Score d'Activité"** - Carte et onglet retirés

#### ✅ **Ajouté:**
1. **"Termes Signalés"** - Nouvelle carte montrant le nombre de signalements effectués
2. **Onglet "Signalements effectués"** - Liste détaillée des rapports créés
3. **Onglet "Activités totales"** - Vue d'ensemble des contributions

---

## 🎨 Nouvelles Cartes Statistiques (Chercheur)

### Configuration Actuelle (4 cartes) :

```
┌──────────────────────────────────────────────────────────────┐
│  [❤️] Termes Appréciés                                       │
│  Valeur: X                                                   │
│  "Termes que vous avez aimés"                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  [✏️] Modifications Proposées                                │
│  Valeur: X                                                   │
│  "X approuvées, X en attente"                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  [⚠️] Termes Signalés                            [NOUVEAU]   │
│  Valeur: X                                                   │
│  "Signalements que vous avez effectués"                      │
│  Couleur: Orange (from-orange-500 to-orange-400)            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  [📊] Activités Totales                                      │
│  Valeur: X                                                   │
│  "X likes + X modifications + X signalements"                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📑 Nouveaux Onglets (Chercheur)

### Configuration Actuelle (4 onglets) :

1. **Termes appréciés** (liked)
2. **Modifications proposées** (modifications)
3. **Signalements effectués** (reports) ✨ NOUVEAU
4. **Activités totales** (activities) ✨ NOUVEAU

---

## 🚩 Onglet "Signalements effectués"

Affiche un tableau détaillé des rapports créés par le chercheur :

```
┌────────────────────────────────────────────────────────────────┐
│  Signalements effectués                                        │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│ Terme        │ Raison       │ Statut       │ Date             │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ COACHING     │ Erreur       │ [Résolu]     │ 12/10/2025       │
│              │              │ (vert)       │                  │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ MOTIVATION   │ Incomplet    │ [En attente] │ 13/10/2025       │
│              │              │ (jaune)      │                  │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

### Colonnes :
- **Terme signalé** : Lien cliquable vers la fiche
- **Raison** : Raison du signalement
- **Statut** : Badge coloré (Résolu/Examiné/Ignoré/En attente)
- **Date** : Date de création du signalement

### Badge de Statut (avec couleurs) :
| Statut | Couleur | Badge |
|--------|---------|-------|
| **resolved** | Vert | 🟢 Résolu |
| **reviewed** | Bleu | 🔵 Examiné |
| **ignored** | Gris | ⚫ Ignoré |
| **pending** | Jaune | 🟡 En attente |

### Message si vide :
```
"Vous n'avez pas encore signalé de terme. 
Visitez une fiche pour signaler un problème."
```

---

## 📈 Onglet "Activités totales"

Vue d'ensemble visuelle des contributions du chercheur :

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ ❤️ Termes   │  │ ✏️ Modifs   │  │ ⚠️ Signale  │           │
│  │   aimés     │  │             │  │   -ments    │           │
│  │             │  │             │  │             │           │
│  │     42      │  │     15      │  │      8      │           │
│  │             │  │             │  │             │           │
│  │ Termes que  │  │ Propositions│  │ Termes      │           │
│  │ vous        │  │ de          │  │ signalés    │           │
│  │ appréciez   │  │ modifications│ │             │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │  Total des activités                    65       │         │
│  │  Contribution globale à la plateforme            │         │
│  │                                                   │         │
│  │  [Dégradé violet/bleu avec bordure primaire]    │         │
│  └──────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────┘
```

### Cartes de métrique :
1. **Termes aimés** (Rose)
2. **Modifications** (Jaune)
3. **Signalements** (Orange)

### Total :
- Grande carte en bas avec dégradé violet/bleu
- Affiche la somme de toutes les activités
- Police de grande taille (4xl) pour le nombre

---

## 🔧 Backend - Nouvelles Statistiques

### Endpoint: `GET /api/dashboard/stats`

**Ajout de la statistique `reports.created` :**

```javascript
// Reports created by user (for researchers/chercheurs)
const [reportsCreated] = await db.query(
  `SELECT COUNT(*) as count 
   FROM reports 
   WHERE reporter_id = ?`,
  [userId]
);

stats.reports = {
  received: Number(reportsReceived.count || 0),  // Pour auteurs
  created: Number(reportsCreated.count || 0),    // Pour chercheurs ✨ NOUVEAU
};
```

### Réponse API (pour chercheur) :
```json
{
  "likes": {
    "given": 42
  },
  "decisions": {
    "made": 15,
    "byType": {
      "approved": 10,
      "pending": 5
    }
  },
  "reports": {
    "created": 8  // ✨ NOUVEAU
  },
  "activities": {
    "total": 65  // likes + decisions + reports
  }
}
```

---

## 📁 Fichiers Modifiés

### 1. **Backend: `dashboard.js`**
**Emplacement:** `backend/routes/dashboard.js`

**Changement:**
```javascript
// Ajout de la requête pour compter les rapports créés
const [reportsCreated] = await db.query(
  `SELECT COUNT(*) as count 
   FROM reports 
   WHERE reporter_id = ?`,
  [userId]
);

stats.reports = {
  received: Number(reportsReceived.count || 0),
  created: Number(reportsCreated.count || 0),  // ✨ NOUVEAU
};
```

---

### 2. **Frontend: `Dashboard.jsx`**
**Emplacement:** `src/pages/Dashboard.jsx`

**Changements majeurs:**

#### a) Ajout des états pour les rapports
```javascript
const [userReports, setUserReports] = useState([]);
const [reportsLoading, setReportsLoading] = useState(false);
```

#### b) Fetch des rapports utilisateur
```javascript
useEffect(() => {
  const fetchUserReports = async () => {
    if (!user?.id || !isResearcher) return;
    
    const data = await apiService.default.getReports();
    const myReports = data.filter(
      r => String(r.reporter_id || r.reporterId) === String(user.id)
    );
    setUserReports(myReports);
  };
  
  fetchUserReports();
}, [user?.id, isResearcher]);
```

#### c) Mise à jour baseStatsData (chercheur)
```javascript
if (isResearcher) {
  return {
    liked: dashboardStats?.likes?.given || 0,
    modifications: dashboardStats?.decisions?.made || 0,
    approved: dashboardStats?.decisions?.byType?.approved || 0,
    pending: dashboardStats?.decisions?.byType?.pending || 0,
    reportsCreated: dashboardStats?.reports?.created || 0,  // ✨ NOUVEAU
    totalActivities: 
      (likes.given) + 
      (decisions.made) + 
      (reports.created),  // ✨ NOUVEAU
  };
}
```

#### d) Nouvelles cartes statistiques (4 cartes au lieu de 5)
```javascript
statCards = [
  { title: "Termes Appréciés", icon: Heart, ... },
  { title: "Modifications Proposées", icon: Edit, ... },
  { title: "Termes Signalés", icon: AlertTriangle, ... },  // ✨ NOUVEAU
  { title: "Activités Totales", icon: BarChart2, 
    description: "X likes + X modifications + X signalements" },  // ✨ MODIFIÉ
];
```

#### e) Nouveaux onglets (4 au lieu de 4, mais différents)
```javascript
researcherTabs = [
  { key: "liked", label: "Termes appréciés" },
  { key: "modifications", label: "Modifications proposées" },
  { key: "reports", label: "Signalements effectués" },  // ✨ NOUVEAU
  { key: "activities", label: "Activités totales" },    // ✨ NOUVEAU
];
```

#### f) Nouveaux cas dans renderTabContent
- **case "reports"**: Tableau des signalements avec statut coloré
- **case "activities"**: Vue d'ensemble avec 3 cartes + total

---

## 🎯 Avant / Après

### AVANT (5 cartes + 4 onglets) :
```
Cartes Chercheur:
1. ❤️ Termes Appréciés
2. 📚 Documents de Recherche      ❌ SUPPRIMÉ
3. ✏️ Modifications Proposées
4. 📊 Activités Totales
5. ⭐ Score d'Activité             ❌ SUPPRIMÉ

Onglets:
1. Termes appréciés
2. Documents de recherche          ❌ SUPPRIMÉ
3. Modifications proposées
4. Score d'activité                ❌ SUPPRIMÉ
```

### APRÈS (4 cartes + 4 onglets) :
```
Cartes Chercheur:
1. ❤️ Termes Appréciés
2. ✏️ Modifications Proposées
3. ⚠️ Termes Signalés              ✅ NOUVEAU
4. 📊 Activités Totales (mise à jour)

Onglets:
1. Termes appréciés
2. Modifications proposées
3. Signalements effectués          ✅ NOUVEAU
4. Activités totales               ✅ NOUVEAU
```

---

## 🔄 Calcul des Activités Totales

**Nouvelle formule pour chercheurs :**
```javascript
totalActivities = 
  likesGiven + 
  modificationsProposed + 
  reportsCreated
```

**Exemple :**
- Likes donnés : 42
- Modifications proposées : 15
- Signalements effectués : 8
- **Total : 65 activités**

---

## 🎨 Design & UX

### Cohérence Visuelle :
- **Rose** pour les likes (Heart)
- **Jaune** pour les modifications (Edit)
- **Orange** pour les signalements (AlertTriangle) ✨ NOUVEAU
- **Violet/Bleu** pour le total (BarChart2)

### Interactivité :
- Les cartes sont cliquables pour changer d'onglet
- Hover effects sur les lignes des tableaux
- Badges colorés pour les statuts
- Liens vers les fiches de termes

---

## ✅ Avantages

1. **Plus pertinent** : Retire les fonctionnalités non utilisées (documents, score)
2. **Plus actionnable** : Montre les signalements effectués avec leur statut
3. **Meilleur suivi** : Vue claire des contributions réelles
4. **Interface épurée** : 4 cartes au lieu de 5, plus lisible
5. **Engagement** : Encourage les signalements de qualité

---

**Date de mise à jour :** 13 Octobre 2025  
**Version :** 3.0  
**Statut :** ✅ Implémenté et Fonctionnel
