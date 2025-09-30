import { useState, useEffect } from 'react';
import apiService from '../services/api';

// Hook pour tester la connexion API
export const useApiConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setIsLoading(true);
        await apiService.testConnection();
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setIsConnected(false);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    testConnection();
  }, []);

  return { isConnected, isLoading, error };
};

// Hook pour récupérer les termes
export const useTerms = (params = {}) => {
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getTerms(params);
        setTerms(response.data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setTerms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, [JSON.stringify(params)]);

  return { terms, isLoading, error, refetch: () => setIsLoading(true) };
};

// Hook pour récupérer un terme spécifique
export const useTerm = (id) => {
  const [term, setTerm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchTerm = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getTerm(id);
        setTerm(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setTerm(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerm();
  }, [id]);

  return { term, isLoading, error };
};

// Hook pour les catégories
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getCategories();
        setCategories(response.data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
};

// Hook pour les statistiques
export const useStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getStats();
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
};

// Hook pour créer un terme
export const useCreateTerm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTerm = async (termData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.createTerm(termData);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createTerm, isLoading, error };
};

// Hook générique pour les requêtes API
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await apiCall();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const refetch = () => {
    setIsLoading(true);
  };

  return { data, isLoading, error, refetch };
};