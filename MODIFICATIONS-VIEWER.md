# 📋 Système de Visualisation des Modifications - Documentation

## 🎯 Vue d'ensemble

Quand un admin/auteur consulte les **modifications proposées**, il peut maintenant cliquer sur **"Voir les changements"** pour accéder à une page détaillée qui affiche une **comparaison visuelle côte à côte** entre l'ancienne et la nouvelle version du terme.

---

## 🔄 Flux de Travail

### 1️⃣ **Dashboard Admin - Modifications Proposées**

Dans le panneau admin (`/admin` → Onglet "Modifications Proposées"), chaque modification affiche maintenant **2 boutons** :

```
┌─────────────────────────────────────────────────────────────┐
│  📝 Modification pour: VERBALISER SES ÉMOTIONS              │
│  👤 Proposée par: CHAFIK@DICT.COM                           │
│  📅 Le 13/10/2025 15:04:24                    [En attente]  │
│  💬 "Commentaire du proposeur..."                           │
│                                                              │
│  [📄 Voir les changements]  [👁️ Voir le terme]             │
│  [✅ Approuver]  [❌ Rejeter]                               │
└─────────────────────────────────────────────────────────────┘
```

**Boutons disponibles :**
- **📄 Voir les changements** → Redirige vers `/modifications/:id` (nouvelle fonctionnalité)
- **👁️ Voir le terme** → Redirige vers `/fiche/:slug` (fiche publique)
- **✅ Approuver** → Approuve et applique immédiatement
- **❌ Rejeter** → Rejette la proposition

---

### 2️⃣ **Page de Détails des Modifications** (`/modifications/:id`)

Quand on clique sur **"Voir les changements"**, on accède à une page dédiée qui affiche :

#### 🎨 **En-tête Visuel**

```
┌────────────────────────────────────────────────────────────────┐
│  [✏️]  Modification proposée pour: VERBALISER SES ÉMOTIONS 🔗 │
│                                                                 │
│  👤 Proposé par : CHAFIK@DICT.COM                              │
│  📅 Le 13/10/2025 15:04:24              [🟡 En attente]        │
└────────────────────────────────────────────────────────────────┘
```

#### 📊 **Comparaison Visuelle (Diff Viewer)**

Pour **chaque champ modifié**, affichage côte à côte avec code couleur :

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ Définition                                                   │
│  ┌──────────────────────────┬──────────────────────────────┐   │
│  │  🔴 Ancienne version      │  🟢 Nouvelle version proposée│   │
│  │                           │                              │   │
│  │  Exprimer ses émotions    │  Exprimer ses émotions de    │   │
│  │  de manière verbale.      │  manière verbale et claire   │   │
│  │                           │  pour faciliter la           │   │
│  │  [Texte en rouge]         │  communication.              │   │
│  │                           │                              │   │
│  │                           │  [Texte en vert]             │   │
│  └──────────────────────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Caractéristiques visuelles :**
- ❌ **Ancienne version** : 
  - Bordure **rouge** (`border-red-300`)
  - Fond **rouge clair** (`bg-red-50/50`)
  - Point indicateur **rouge** (`bg-red-500`)
  - Texte en **rouge foncé** (`text-red-900`)

- ✅ **Nouvelle version** : 
  - Bordure **verte** (`border-green-300`)
  - Fond **vert clair** (`bg-green-50/50`)
  - Point indicateur **vert** (`bg-green-500`)
  - Texte en **vert foncé** (`text-green-900`)

#### 💬 **Commentaires**

Si le contributeur ou l'admin a ajouté des commentaires :

```
┌─────────────────────────────────────────────────────────────┐
│  [👤]  Commentaire du contributeur                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  J'ai amélioré la définition pour la rendre plus      │  │
│  │  claire et ajouter des exemples concrets.             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                           [Fond bleu clair]  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [⚠️]  Commentaire de modération                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Modification approuvée après vérification            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                        [Fond ambre clair]    │
└─────────────────────────────────────────────────────────────┘
```

#### 🎬 **Boutons d'Action**

En bas de page (uniquement si statut = "En attente" et utilisateur = admin/auteur) :

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                  [❌ Rejeter la modification]                │
│                  [✅ Approuver et appliquer]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Palette de Couleurs

| Élément | Couleur | Usage |
|---------|---------|-------|
| **Rouge** | `bg-red-50/50` | Ancienne version (à supprimer) |
| **Vert** | `bg-green-50/50` | Nouvelle version (à ajouter) |
| **Bleu** | `bg-blue-50/50` | Commentaire du contributeur |
| **Ambre** | `bg-amber-50/50` | Commentaire de modération |
| **Violet/Bleu** | `from-purple-50 to-blue-50` | En-tête de la carte |

---

## 📁 Fichiers Modifiés

### 1. **`ProposedModifications.jsx`**
**Emplacement :** `src/components/admin/ProposedModifications.jsx`

**Changement :** Ajout du bouton "Voir les changements"

```jsx
<Button variant="outline" size="sm" asChild>
  <Link to={`/modifications/${modification.id}`}>
    <FileEdit className="mr-2 h-4 w-4" /> Voir les changements
  </Link>
</Button>
```

---

### 2. **`ModificationDetails.jsx`**
**Emplacement :** `src/pages/ModificationDetails.jsx`

**Changements :**

#### a) Imports mis à jour
```jsx
import { ArrowLeft, Check, X, User, Calendar, AlertCircle, Edit, ExternalLink } from "lucide-react";
```

#### b) Composant DiffViewer amélioré
- Bordures colorées plus épaisses (`border-2`)
- Indicateurs visuels circulaires (points rouge/vert)
- Meilleur contraste et lisibilité
- Ombres subtiles pour la profondeur

#### c) En-tête avec icône et gradient
```jsx
<CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
  <div className="flex items-start gap-4">
    <div className="p-3 bg-primary/10 rounded-lg">
      <Edit className="h-8 w-8 text-primary" />
    </div>
    {/* ... */}
  </div>
</CardHeader>
```

#### d) Commentaires stylisés
- Commentaire contributeur : **Bleu** avec icône User
- Commentaire modération : **Ambre** avec icône AlertCircle

#### e) Boutons d'action améliorés
- Taille plus grande (`size="lg"`)
- Bouton "Approuver" avec fond vert personnalisé
- Responsive (colonnes sur mobile, rangée sur desktop)

---

## 🔐 Permissions

| Rôle | Peut voir les changements | Peut approuver/rejeter |
|------|---------------------------|------------------------|
| **Admin** | ✅ Oui | ✅ Oui (toutes les modifications) |
| **Auteur** | ✅ Oui | ✅ Oui (uniquement ses termes) |
| **Chercheur** | ✅ Oui (ses propres propositions) | ❌ Non |

---

## 🚀 Navigation

### Depuis le Dashboard Admin :
```
/admin 
  → Onglet "Modifications Proposées"
    → Clic sur "Voir les changements"
      → /modifications/:id
```

### Depuis la page Modifications :
```
/modifications
  → Liste des modifications
    → Clic sur une modification
      → /modifications/:id
```

---

## 📊 Exemple Complet de Comparaison

Imaginons une modification pour le terme **"COACHING"** :

### Champs modifiés affichés :

#### 1. **Définition**
```
┌──────────────────────────┬──────────────────────────────┐
│ 🔴 Ancien                │ 🟢 Nouveau                    │
├──────────────────────────┼──────────────────────────────┤
│ Processus                │ Processus d'accompagnement   │
│ d'accompagnement         │ professionnel visant à       │
│                          │ développer les compétences   │
└──────────────────────────┴──────────────────────────────┘
```

#### 2. **Exemples** (si modifiés)
```
┌──────────────────────────┬──────────────────────────────┐
│ 🔴 Anciens exemples      │ 🟢 Nouveaux exemples         │
├──────────────────────────┼──────────────────────────────┤
│ • Exemple 1              │ • Exemple amélioré 1         │
│ • Exemple 2              │ • Exemple amélioré 2         │
│                          │ • Nouvel exemple 3           │
└──────────────────────────┴──────────────────────────────┘
```

#### 3. **Sources** (si modifiées)
```
┌──────────────────────────┬──────────────────────────────┐
│ 🔴 Anciennes sources     │ 🟢 Nouvelles sources         │
├──────────────────────────┼──────────────────────────────┤
│ • Source A               │ • Source A (mise à jour)     │
│                          │ • Nouvelle source B          │
│                          │   🔗 https://example.com     │
└──────────────────────────┴──────────────────────────────┘
```

---

## ✨ Avantages de ce Système

1. **👁️ Visibilité claire** : Les différences sont immédiatement visibles
2. **🎨 Code couleur intuitif** : Rouge = suppression, Vert = ajout
3. **📱 Responsive** : S'adapte aux mobiles et tablettes
4. **🔍 Comparaison complète** : Tous les champs modifiés sont affichés
5. **💬 Contexte** : Les commentaires expliquent le "pourquoi"
6. **⚡ Action rapide** : Approuver/rejeter directement depuis la page
7. **🔗 Navigation fluide** : Lien vers la fiche du terme pour contexte

---

## 🎯 Utilisation Recommandée

### Pour les Admins :
1. Consulter **"Modifications Proposées"** dans le dashboard admin
2. Cliquer sur **"Voir les changements"** pour une proposition
3. **Comparer** visuellement ancien vs nouveau
4. **Lire** les commentaires du contributeur
5. **Décider** : Approuver ou rejeter

### Pour les Auteurs :
1. Même processus que les admins
2. Peuvent uniquement traiter les modifications sur **leurs propres termes**

### Pour les Chercheurs :
1. Peuvent voir leurs **propres propositions** dans `/modifications`
2. Visualiser le statut (en attente, approuvé, rejeté)
3. Consulter les commentaires de modération si rejeté

---

**Date de mise à jour :** 13 Octobre 2025  
**Version :** 2.0  
**Statut :** ✅ Implémenté et Fonctionnel
