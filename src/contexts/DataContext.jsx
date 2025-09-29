import React, { createContext, useState, useEffect, useContext } from 'react';
import slugify from 'slugify';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const API_URL = 'https://cornflowerblue-lapwing-627570.hostingersite.com/api.php';

const processApiData = (apiTerms) => {
  return apiTerms.map((item, index) => {
    const examples = (item.exemples && typeof item.exemples === 'string' && item.exemples.trim() !== '')
      ? [{ text: item.exemples }]
      : [];

    const sources = (item.sources && typeof item.sources === 'string' && item.sources.trim() !== '')
      ? [{ text: item.sources, url: '' }]
      : [];

    return {
      id: item.id || `term-${index + 1}`,
      slug: slugify(item.terme, { lower: true, strict: true }),
      term: item.terme,
      category: 'Coaching',
      definition: item.definition,
      examples: examples,
      sources: sources,
      authorId: 'user-api',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: Math.floor(Math.random() * 100),
    };
  });
};

export const DataProvider = ({ children }) => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = () => {
    setLoading(true);
    try {
      const localTerms = JSON.parse(localStorage.getItem('coaching_dict_terms') || '[]');
      // Ensure all local terms also have category 'Coaching'
      const updatedLocalTerms = localTerms.map(term => ({
        ...term,
        category: 'Coaching'
      }));
      setTerms(updatedLocalTerms);
      localStorage.setItem('coaching_dict_terms', JSON.stringify(updatedLocalTerms)); // Persist the update
    } catch (e) {
      console.error("Error reading local terms:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFetch = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
          const processedTerms = processApiData(data);
          
          // Combine API data with local data if any, prioritizing local for user-made changes.
          // Also, ensure existing local terms are updated to 'Coaching' category
          let localTerms = JSON.parse(localStorage.getItem('coaching_dict_terms') || '[]');
          localTerms = localTerms.map(term => ({
            ...term,
            category: 'Coaching'
          }));

          const localTermsIds = new Set(localTerms.map(t => t.id));
          const newApiTerms = processedTerms.filter(t => !localTermsIds.has(t.id));
          
          const combinedTerms = [...localTerms, ...newApiTerms];
          setTerms(combinedTerms);
          localStorage.setItem('coaching_dict_terms', JSON.stringify(combinedTerms));
          localStorage.setItem('coaching_dict_terms_initialized', 'true'); // Mark as initialized after successful API fetch and processing
        } else {
          throw new Error("Format de données API invalide");
        }
        
      } catch (e) {
        console.error("Erreur lors de la récupération des données de l'API:", e);
        setError(e.message);
        const localTerms = localStorage.getItem('coaching_dict_terms');
        if (localTerms) {
          // If API fetch fails, ensure local terms are still processed for category
          const updatedLocalTerms = JSON.parse(localTerms).map(term => ({
            ...term,
            category: 'Coaching'
          }));
          setTerms(updatedLocalTerms);
          localStorage.setItem('coaching_dict_terms', JSON.stringify(updatedLocalTerms));
        }
      } finally {
        setLoading(false);
      }
    };

    if (!localStorage.getItem('coaching_dict_terms_initialized')) {
      initialFetch();
    } else {
      fetchData(); // Just load from local storage if already initialized, ensuring category is correct
    }
  }, []);

  const refreshData = () => {
    fetchData();
  }

  const value = {
    terms,
    loading,
    error,
    setTerms,
    refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};