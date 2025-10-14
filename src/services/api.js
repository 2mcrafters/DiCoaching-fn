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
      // Silently re-throw AbortError without logging (expected during navigation/unmount)
      if (
        error &&
        (error.name === "AbortError" || error.code === "ABORT_ERR")
      ) {
        // Don't log abort errors - they're expected during component unmount or navigation
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

  // Utilisateurs
  async getUsers() {
    return this.get("/api/users");
  }

  async getUser(id) {
    return this.get(`/api/users/${id}`);
  }

  async createUser(userData) {
    return this.post("/api/users", userData);
  }

  async updateUser(id, userData) {
    return this.put(`/api/users/${id}`, userData);
  }

  async getUserStats(id) {
    return this.get(`/api/users/${id}/stats`);
  }

  async deleteUser(id) {
    return this.delete(`/api/users/${id}`);
  }

  // Gestion des signalements
  async getReports() {
    const response = await this.get("/api/reports");
    return response.data || response;
  }

  async createReport(reportData) {
    const response = await this.post("/api/reports", reportData);
    return response.data || response;
  }

  async updateReport(id, reportData) {
    const response = await this.put(`/api/reports/${id}`, reportData);
    return response.data || response;
  }

  async deleteReport(id) {
    const response = await this.delete(`/api/reports/${id}`);
    return response.data || response;
  }

  // Modifications
  async getModifications() {
    return this.get("/api/modifications");
  }

  async getModificationById(id, options = {}) {
    return this.get(`/api/modifications/${id}`, options);
  }

  async createModification(modificationData) {
    return this.post("/api/modifications", modificationData);
  }

  async updateModification(id, modificationData) {
    return this.put(`/api/modifications/${id}`, modificationData);
  }

  async deleteModification(id) {
    return this.delete(`/api/modifications/${id}`);
  }

  // Comments
  async getAuthorComments(authorId) {
    return this.get(`/api/comments/author/${authorId}`);
  }

  // Reports on author's terms
  async getAuthorReports(authorId) {
    const res = await this.get(`/api/reports/author/${authorId}`);
    return res?.data ?? res;
  }

  async deleteComment(commentId) {
    return this.delete(`/api/comments/${commentId}`);
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

  // Likes
  async getLikes(termId) {
    const res = await this.get(`/api/terms/${termId}/likes`);
    return res?.data ?? res;
  }

  async toggleLike(termId) {
    const res = await this.post(`/api/terms/${termId}/likes/toggle`, {});
    return res?.data ?? res;
  }

  async getMyLike(termId) {
    const res = await this.get(`/api/terms/${termId}/likes/me`);
    return res?.data ?? res;
  }

  async getUserLikeStats() {
    const res = await this.get("/api/user/likes/stats");
    return res?.data ?? res;
  }

  async getUserLikedTerms() {
    const res = await this.get("/api/user/liked-terms");
    return res?.data ?? res;
  }

  // Comments
  async getComments(termId) {
    const res = await this.get(`/api/terms/${termId}/comments`);
    return res?.data ?? res;
  }

  async addComment(termId, content) {
    const res = await this.post(`/api/terms/${termId}/comments`, { content });
    return res?.data ?? res;
  }

  async deleteComment(commentId) {
    const res = await this.delete(`/api/comments/${commentId}`);
    return res?.data ?? res;
  }

  // Decisions
  async getDecisions() {
    const res = await this.get("/api/decisions");
    return res?.data ?? res;
  }

  async getTermDecisions(termId) {
    const res = await this.get(`/api/terms/${termId}/decisions`);
    return res?.data ?? res;
  }

  async createDecision(termId, decisionType, comment) {
    const res = await this.post("/api/decisions", {
      termId,
      decisionType,
      comment,
    });
    return res?.data ?? res;
  }

  async updateDecision(decisionId, data) {
    const res = await this.put(`/api/decisions/${decisionId}`, data);
    return res?.data ?? res;
  }

  async deleteDecision(decisionId) {
    const res = await this.delete(`/api/decisions/${decisionId}`);
    return res?.data ?? res;
  }

  async getDecisionStats() {
    const res = await this.get("/api/decisions/stats");
    return res?.data ?? res;
  }

  // Dashboard
  async getDashboardStats() {
    const res = await this.get("/api/dashboard/stats");
    return res?.data ?? res;
  }

  async getDashboardChartData(period = 30) {
    const res = await this.get(`/api/dashboard/chart-data?period=${period}`);
    return res?.data ?? res;
  }
}

// Instance singleton
const apiService = new ApiService();

export default apiService;
