// Configuration de l'API
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Méthode générique pour les requêtes
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Ajouter l'en-tête d'autorisation si l'utilisateur est connecté
    if (authService.isAuthenticated()) {
      config.headers['Authorization'] = `Bearer ${authService.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Gérer l'expiration du token
      if (response.status === 401 || response.status === 403) {
        authService.logout();
        window.location.href = '/login';
        throw new Error('Session expirée');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Méthodes GET
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // Méthodes POST
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Méthodes PUT
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Méthodes DELETE
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // === Routes spécifiques ===

  // Test de connexion
  async testConnection() {
    return this.get('/health');
  }

  // Test de la base de données
  async testDatabase() {
    return this.get('/api/test-db');
  }

  // Termes du dictionnaire
  async getTerms(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.get(`/api/terms?${searchParams}`);
  }

  async getTerm(id) {
    return this.get(`/api/terms/${id}`);
  }

  async createTerm(termData) {
    return this.post('/api/terms', termData);
  }

  async updateTerm(id, termData) {
    return this.put(`/api/terms/${id}`, termData);
  }

  async deleteTerm(id) {
    return this.delete(`/api/terms/${id}`);
  }

  // Recherche de termes
  async searchTerms(query, options = {}) {
    const params = { search: query, ...options };
    return this.getTerms(params);
  }

  // Catégories
  async getCategories() {
    return this.get('/api/categories');
  }

  // Statistiques
  async getStats() {
    return this.get('/api/stats');
  }

  // Utilisateurs (à implémenter plus tard)
  async getUsers() {
    return this.get('/api/users');
  }

  async getUser(id) {
    return this.get(`/api/users/${id}`);
  }

  // Authentification (à implémenter plus tard)
  async login(credentials) {
    return this.post('/api/auth/login', credentials);
  }

  async register(userData) {
    return this.post('/api/auth/register', userData);
  }

  async logout() {
    return this.post('/api/auth/logout');
  }
}

// Instance singleton
const apiService = new ApiService();

export default apiService;