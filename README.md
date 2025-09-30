# Dictionnaire Coaching - Monorepo Frontend + Backend

## 📋 Description

Application web complète pour un dictionnaire de coaching avec frontend React et backend Node.js/Express.

## 🏗 Architecture

```
dictionnaire/
├── src/                     # Frontend React
├── backend/                 # Backend Node.js/Express
├── public/                  # Assets statiques
└── package.json            # Configuration partagée
```

## 🚀 Démarrage rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration de l'environnement

Le projet utilise des variables d'environnement pour la configuration :

- **Frontend** : `.env` (racine)
- **Backend** : `backend/.env`

### 3. Démarrage de l'application

#### Option 1 : Frontend + Backend ensemble (recommandé pour le développement)

```bash
npm run dev:fullstack
```

Cette commande démarre :
- Frontend React sur `http://localhost:3000`
- Backend API sur `http://localhost:5000`

#### Option 2 : Démarrage séparé

**Frontend uniquement :**
```bash
npm run dev
```

**Backend avec données mockées :**
```bash
npm run backend:mock
```

**Backend avec base de données :**
```bash
npm run backend:dev
```

## 🗄️ Base de données

### Configuration actuelle : Données mockées

Le backend utilise actuellement des données mockées pour simplifier la configuration initiale.

### Configuration MySQL (optionnelle)

Pour utiliser MySQL (actuellement le système fonctionne avec des données mockées) :

#### 1. Installer MySQL

**Windows :**
- Télécharger [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
- Ou installer via Chocolatey : `choco install mysql`
- Ou utiliser [XAMPP](https://www.apachefriends.org/) qui inclut MySQL

**Alternative - MariaDB :**
- Plus simple à installer : `choco install mariadb`

#### 2. Configurer MySQL

1. **Démarrer le service MySQL**
2. **Créer un utilisateur (si nécessaire) :**
   ```sql
   CREATE USER 'dictionnaire'@'localhost' IDENTIFIED BY 'password123';
   GRANT ALL PRIVILEGES ON *.* TO 'dictionnaire'@'localhost';
   FLUSH PRIVILEGES;
   ```

#### 3. Mettre à jour la configuration

Modifier `backend/.env` :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=dict
DB_PORT=3306
```

#### 4. Tester et initialiser

```bash
# Tester la connexion
npm run db:test

# Initialiser la base de données
npm run db:setup

# Démarrer avec la base de données
npm run dev:fullstack-db
```

## 📡 API Endpoints

### Endpoints disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/` | GET | Informations sur l'API |
| `/health` | GET | Statut de santé |
| `/api/test-db` | GET | Test de connexion DB |
| `/api/terms` | GET | Liste des termes |
| `/api/terms/:id` | GET | Terme spécifique |
| `/api/terms` | POST | Créer un terme |
| `/api/categories` | GET | Liste des catégories |
| `/api/stats` | GET | Statistiques |

### Test de l'API

1. **Via l'interface web :** Visitez `http://localhost:3000/api-test`
2. **Via curl :**
   ```bash
   curl http://localhost:5000/api/test-db
   curl http://localhost:5000/api/terms
   ```

## 🛠 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Frontend uniquement |
| `npm run backend:mock` | Backend avec données mockées |
| `npm run backend:dev` | Backend avec base de données |
| `npm run dev:fullstack` | Frontend + Backend (mock) |
| `npm run dev:fullstack-db` | Frontend + Backend (DB) |
| `npm run build` | Build de production |
| `npm run db:setup` | Configuration de la base de données |

## 🔧 Configuration

### Variables d'environnement

**Frontend (.env) :**
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Dictionnaire Coaching
```

**Backend (backend/.env) :**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dicoaching
JWT_SECRET=your_secret_key
```

## 📁 Structure des dossiers

```
src/
├── components/         # Composants React
├── pages/             # Pages de l'application
├── hooks/             # Hooks personnalisés
├── services/          # Services API
├── contexts/          # Contextes React
└── lib/              # Utilitaires

backend/
├── server.js         # Serveur principal (avec DB)
├── server-mock.js    # Serveur avec données mockées
├── services/         # Services backend
├── database/         # Scripts de base de données
├── routes/           # Routes API
└── middleware/       # Middlewares
```

## 🌐 URLs importantes

- **Frontend :** http://localhost:3000
- **Backend API :** http://localhost:5000
- **Test API :** http://localhost:3000/api-test
- **API Health :** http://localhost:5000/health

## 📝 Développement

### Ajout de nouvelles fonctionnalités

1. **Frontend :** Créer des composants dans `src/components/`
2. **Backend :** Ajouter des routes dans `backend/routes/`
3. **API :** Mettre à jour `src/services/api.js`

### Données mockées vs Base de données

- **Développement rapide :** Utilisez les données mockées
- **Production :** Configurez MySQL avec `npm run db:setup`

## 🚨 Dépannage

### Erreur de connexion API

1. Vérifiez que le backend est démarré sur le port 5000
2. Vérifiez la variable `VITE_API_URL` dans `.env`
3. Consultez la page `/api-test` pour diagnostiquer

### Erreur de base de données

1. Utilisez `npm run backend:mock` pour des données mockées
2. Vérifiez la configuration MySQL dans `backend/.env`
3. Exécutez `npm run db:setup` pour initialiser la DB

## 📋 TODO

- [ ] Implémentation de l'authentification JWT
- [ ] Routes CRUD complètes pour les termes
- [ ] Gestion des utilisateurs et rôles
- [ ] Upload de fichiers/images
- [ ] Tests unitaires et d'intégration
- [ ] Documentation API avec Swagger

## 🤝 Contribution

1. Fork du projet
2. Créer une branche feature
3. Commit des changements
4. Push et créer une Pull Request