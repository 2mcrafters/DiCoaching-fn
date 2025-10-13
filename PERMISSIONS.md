# 🔐 Système de Permissions - Dictionnaire Collaboratif

## Vue d'ensemble des Rôles

### 👤 **Chercheur (Researcher)**
**Capacités:**
- ✅ **Rechercher** et consulter les termes
- ✅ **Liker** des termes
- ✅ **Commenter** sur les termes
- ✅ **Proposer des modifications** sur n'importe quel terme
- ✅ Uploader des **documents de recherche**
- ✅ Voir ses statistiques d'activité

**Restrictions:**
- ❌ **NE PEUT PAS** modifier directement un terme
- ❌ **NE PEUT PAS** créer de nouveaux termes
- ❌ **NE PEUT PAS** approuver/rejeter des modifications

**Workflow:**
```
Chercheur trouve un terme → Clique "Proposer une modification" → 
Soumet les changements → Attente de validation par Admin/Auteur
```

---

### ✍️ **Auteur (Author)**
**Capacités:**
- ✅ **Créer** de nouveaux termes
- ✅ **Modifier directement** UNIQUEMENT SES PROPRES TERMES
- ✅ **Approuver/Rejeter** les modifications proposées sur ses termes
- ✅ Toutes les capacités d'un Chercheur (liker, commenter, etc.)

**Restrictions:**
- ❌ **NE PEUT PAS** modifier les termes d'autres auteurs
- ❌ **NE PEUT PAS** accéder au panneau admin

**Workflow pour modification:**
```
Auteur voit SON terme → Clique "Modifier ce terme" → 
Édite directement → Sauvegarde → Changements appliqués immédiatement
```

**Workflow pour terme d'un autre auteur:**
```
Auteur voit terme d'un autre → Clique "Proposer une modification" → 
Soumet les changements → Attente de validation par le propriétaire/Admin
```

---

### 👑 **Admin (Administrator)**
**Capacités:**
- ✅ **Modifier TOUS les termes** (peu importe l'auteur)
- ✅ **Créer** de nouveaux termes
- ✅ **Approuver/Rejeter** toutes les modifications
- ✅ **Gérer les utilisateurs** (approuver auteurs, bannir, etc.)
- ✅ **Voir les rapports** et statistiques globales
- ✅ Accès au **panneau d'administration**
- ✅ Toutes les capacités des autres rôles

**Workflow:**
```
Admin → Peut tout faire sans restriction → Contrôle total
```

---

## 🔄 Flux de Modification des Termes

### Scénario 1: Auteur modifie SON propre terme
```mermaid
Auteur (propriétaire) → Clique "Modifier ce terme" 
                      → Édite les champs 
                      → Sauvegarde 
                      → ✅ Changements appliqués immédiatement
```

### Scénario 2: Auteur/Chercheur modifie le terme d'un autre
```mermaid
Utilisateur → Clique "Proposer une modification"
            → Remplit le formulaire de proposition
            → Soumet
            → ⏳ État: "En attente"
            → Propriétaire/Admin examine
            → ✅ Approuvé OU ❌ Rejeté
```

### Scénario 3: Admin modifie n'importe quel terme
```mermaid
Admin → Clique "Modifier ce terme" (sur N'IMPORTE QUEL terme)
      → Édite les champs
      → Sauvegarde
      → ✅ Changements appliqués immédiatement
```

---

## 🛡️ Sécurité Backend

### Endpoint: `PUT /api/terms/:id`

**Vérifications effectuées:**
1. ✅ **Authentification** - Token JWT valide requis
2. ✅ **Existence du terme** - Vérification que le terme existe
3. ✅ **Permissions** - Vérification du rôle et de la propriété:
   - Admin ✅ → Autorisé pour tous les termes
   - Auteur ✅ → Autorisé SEULEMENT si `author_id` = `user_id`
   - Chercheur ❌ → Rejeté avec erreur 403
4. ✅ **Validation des données** - Vérification des champs

**Code de vérification:**
```javascript
const isAdmin = userRole === 'admin';
const isAuthor = userRole === 'auteur' || userRole === 'author';
const isOwner = String(existingRow.author_id) === String(userId);

if (!isAdmin && !(isAuthor && isOwner)) {
  return res.status(403).json({ 
    status: 'error', 
    message: 'Vous n\'avez pas la permission de modifier ce terme.' 
  });
}
```

---

## 📊 Dashboard - Boutons d'Action

### Pour Chercheurs:
- **"Rechercher"** - Explore le dictionnaire
- **"Proposer une modification"** - Soumet des suggestions

### Pour Auteurs:
- **"Nouveau terme"** - Crée un nouveau terme
- **"Contribuer un terme"** - Raccourci vers création
- **"Modifications"** - Voir les modifications proposées sur ses termes

### Pour Admins:
- **"Nouveau terme"** - Crée un nouveau terme
- **"Modifications"** - Voir toutes les modifications
- **"Admin"** - Accès au panneau d'administration

---

## 🎯 Boutons sur Fiche Terme

### Bouton visible selon le rôle et la propriété:

| Rôle | Propriété du terme | Bouton affiché |
|------|-------------------|----------------|
| Admin | N'importe quel terme | **"Modifier ce terme"** (édition directe) |
| Auteur | SON terme | **"Modifier ce terme"** (édition directe) |
| Auteur | Terme d'un autre | **"Proposer une modification"** |
| Chercheur | N'importe quel terme | **"Proposer une modification"** |
| Non connecté | N'importe quel terme | Aucun bouton |

---

## 💡 Résumé Simplifié

### Qui peut faire quoi ?

| Action | Chercheur | Auteur | Admin |
|--------|-----------|--------|-------|
| Créer un terme | ❌ | ✅ | ✅ |
| Modifier son propre terme | ❌ | ✅ (ses termes) | ✅ (tous) |
| Modifier terme d'un autre | ❌ | ❌ | ✅ |
| Proposer une modification | ✅ | ✅ | ✅ |
| Approuver une modification | ❌ | ✅ (ses termes) | ✅ (tous) |
| Liker un terme | ✅ | ✅ | ✅ |
| Commenter | ✅ | ✅ | ✅ |
| Accès admin | ❌ | ❌ | ✅ |

---

## 🔧 Fichiers Modifiés

### Frontend:
1. **`src/pages/EditTerm.jsx`** - Vérification propriété pour auteurs
2. **`src/pages/Fiche.jsx`** - Logique d'affichage des boutons
3. **`src/pages/Dashboard.jsx`** - Boutons selon les rôles
4. **`src/components/dashboard/UserTermsList.jsx`** - Actions par rôle

### Backend:
5. **`backend/routes/terms.js`** - Authentification et permissions

---

**Date de mise à jour:** 13 Octobre 2025
**Version:** 1.0
**Statut:** ✅ Implémenté et Fonctionnel
