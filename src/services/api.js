// Configuration de l'API
import authService from './authService';

let API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// Normalize base URL: remove trailing slash and trailing '/api' if present
API_BASE_URL = API_BASE_URL.replace(/\/+$/g, "");
if (API_BASE_URL.endsWith("/api")) {
  API_BASE_URL = API_BASE_URL.slice(0, -4);
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Méthode générique pour les requêtes
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Ajouter l'en-tête d'autorisation si l'utilisateur est connecté
    if (authService.isAuthenticated()) {
      config.headers["Authorization"] = `Bearer ${authService.token}`;
    }

    try {
      const response = await fetch(url, config);

      // Gérer l'expiration du token
      if (response.status === 401 || response.status === 403) {
        authService.logout();
        window.location.href = "/login";
        throw new Error("Session expirée");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Don't spam console for AbortError (AbortController from React StrictMode)
      if (error && error.name === "AbortError") {
        throw error;
      }
      console.error("API Request Error:", error);
      throw error;
    }
  }

  // Méthodes GET
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: "GET", ...options });
  }

  // Méthodes POST
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  }

  // Méthodes PUT
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  }

  // Méthodes DELETE
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options });
  }

  // === Routes spécifiques ===

  // Test de connexion
  async testConnection() {
    return this.get("/health");
  }

  // Test de la base de données
  async testDatabase() {
    return this.get("/api/test-db");
  }

  // Termes du dictionnaire
  async getTerms(params = {}, options = {}) {
    const searchParams = new URLSearchParams(params);
    return this.get(`/api/terms?${searchParams}`, options);
  }

  async getTerm(id, options = {}) {
    return this.get(`/api/terms/${id}`, options);
  }

  async createTerm(termData, options = {}) {
    return this.post("/api/terms", termData, options);
  }

  async updateTerm(id, termData, options = {}) {
    return this.put(`/api/terms/${id}`, termData, options);
  }

  async deleteTerm(id, options = {}) {
    return this.delete(`/api/terms/${id}`, options);
  }

  // Recherche de termes
  async searchTerms(query, options = {}) {
    const params = { search: query, ...options };
    return this.getTerms(params);
  }

  // Catégories
  async getCategories() {
    return this.get("/api/categories");
  }

  // Statistiques
  async getStats() {
    return this.get("/api/stats");
  }

  // Utilisateurs (à implémenter plus tard)
  async getUsers() {
    return this.get("/api/users");
  }

  async getUser(id) {
    return this.get(`/api/users/${id}`);
  }

  // Authentification (à implémenter plus tard)
  async login(credentials) {
    return this.post("/api/auth/login", credentials);
  }

  async register(userData) {
    return this.post("/api/auth/register", userData);
  }

  async logout() {
    return this.post("/api/auth/logout");
  }
}

// Instance singleton
const apiService = new ApiService();

export default apiService;