// Service d'authentification pour communiquer avec l'API backend
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5050/api";

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Configuration des headers avec token
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Connexion
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = { status: 'error', message: 'Réponse invalide du serveur' };
      }

      if (response.ok && data.status === 'success') {
        this.token = data.data.token;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Erreur de connexion' };
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  }

  // Inscription
  async register(userData) {
    try {
      const formData = new FormData();

      // Ajouter les données textuelles
      Object.keys(userData).forEach((key) => {
        if (key === "profilePictureFile" || key === "documents") {
          return; // Skip files for now
        }
        if (userData[key] !== null && userData[key] !== undefined) {
          if (typeof userData[key] === "object") {
            formData.append(key, JSON.stringify(userData[key]));
          } else {
            formData.append(key, userData[key]);
          }
        }
      });

      // Ajouter la photo de profil
      if (userData.profilePictureFile) {
        formData.append("profilePicture", userData.profilePictureFile);
      }

      // Ajouter les documents
      if (userData.documents && Array.isArray(userData.documents)) {
        userData.documents.forEach((doc) => {
          if (doc.file) {
            formData.append("documents", doc.file);
          }
        });
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        body: formData, // Pas de Content-Type header pour FormData
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        this.token = data.data.token;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return { success: true, data: data.data };
      } else {
        // Normalize possible validation error shapes from backend
        // Some backends return { message, errors: { field: "msg" } }
        // or { message, data: { errors: {...} } }
        let fields = {};
        if (data.errors && typeof data.errors === "object") {
          fields = data.errors;
        } else if (
          data.data &&
          data.data.errors &&
          typeof data.data.errors === "object"
        ) {
          fields = data.data.errors;
        } else if (data.validation && typeof data.validation === "object") {
          fields = data.validation;
        } else if (data.fields && typeof data.fields === "object") {
          fields = data.fields;
        }

        const message =
          data.message || Object.values(fields)[0] || "Erreur d'inscription";
        return { success: false, error: { message, fields } };
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return { success: false, error: { message: 'Erreur réseau', fields: {} } };
    }
  }

  // Déconnexion
  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!this.token;
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Obtenir le profil de l'utilisateur depuis l'API
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return { success: true, data: data.data.user };
      } else {
        if (response.status === 401 || response.status === 403) {
          this.logout();
        }
        return { success: false, error: data.message || 'Erreur lors de la récupération du profil' };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  }

  // Mettre à jour le profil utilisateur
  async updateProfile(userId, profileData) {
    try {
      const formData = new FormData();

      // Ajouter les données textuelles
      Object.keys(profileData).forEach((key) => {
        if (key === "profilePictureFile") {
          return; // Skip file for now
        }
        if (profileData[key] !== null && profileData[key] !== undefined) {
          if (typeof profileData[key] === "object") {
            formData.append(key, JSON.stringify(profileData[key]));
          } else {
            formData.append(key, profileData[key]);
          }
        }
      });

      // Ajouter la photo de profil si elle existe
      if (profileData.profilePictureFile) {
        formData.append("profilePicture", profileData.profilePictureFile);
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${this.token}`, // Pas de Content-Type pour FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Mettre à jour les données utilisateur locales
        localStorage.setItem('user', JSON.stringify(data.data));
        return { success: true, data: data.data };
      } else {
        if (response.status === 401 || response.status === 403) {
          this.logout();
        }
        return { success: false, error: data.message || 'Erreur lors de la mise à jour du profil' };
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  }

  // Faire une requête authentifiée
  async authenticatedRequest(url, options = {}) {
    const isFormData =
      options &&
      options.body &&
      typeof FormData !== "undefined" &&
      options.body instanceof FormData;
    const baseHeaders = this.getHeaders();
    // If sending FormData, do NOT set Content-Type manually; the browser will set the boundary
    if (isFormData && baseHeaders["Content-Type"]) {
      delete baseHeaders["Content-Type"];
    }
    const mergedHeaders = {
      ...baseHeaders,
      ...(options.headers || {}),
    };
    if (isFormData && mergedHeaders["Content-Type"]) {
      delete mergedHeaders["Content-Type"];
    }

    const config = {
      ...options,
      headers: mergedHeaders,
    };

    try {
      const response = await fetch(url.startsWith('http') ? url : `${API_BASE_URL}${url}`, config);
      
      if (response.status === 401 || response.status === 403) {
        this.logout();
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      return response;
    } catch (error) {
      console.error('Erreur lors de la requête authentifiée:', error);
      throw error;
    }
  }
}

// Instance unique du service d'authentification
const authService = new AuthService();

export default authService;