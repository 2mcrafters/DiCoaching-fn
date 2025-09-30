import React, { useState } from 'react';
import { useTerms, useCategories } from '../hooks/useApi';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select } from './ui/select';

const TermsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchParams, setSearchParams] = useState({});

  const { terms, isLoading: termsLoading, error: termsError } = useTerms(searchParams);
  const { categories, isLoading: categoriesLoading } = useCategories();

  const handleSearch = () => {
    const params = {};
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSearchParams({});
  };

  if (termsError) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p>{termsError}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Rechercher un terme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={categoriesLoading}
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={termsLoading}>
              Rechercher
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={termsLoading}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des termes */}
      <div className="space-y-4">
        {termsLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : terms.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">
              {Object.keys(searchParams).length > 0 
                ? "Aucun terme trouvé pour cette recherche"
                : "Aucun terme disponible"
              }
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {terms.map((term) => (
              <Card key={term.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {term.term}
                  </h3>
                  <Badge variant="secondary">
                    {term.category}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {term.definition}
                </p>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>ID: {term.id}</span>
                    <Badge 
                      variant={term.status === 'approved' ? 'default' : 'secondary'}
                      className={term.status === 'approved' ? 'bg-green-500' : ''}
                    >
                      {term.status}
                    </Badge>
                  </div>
                  
                  <div>
                    {new Date(term.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Information sur les résultats */}
      {!termsLoading && terms.length > 0 && (
        <Card className="p-4">
          <p className="text-sm text-gray-600 text-center">
            {terms.length} terme(s) affiché(s)
            {Object.keys(searchParams).length > 0 && (
              <span> pour la recherche "{searchParams.search || 'filtres actifs'}"</span>
            )}
          </p>
        </Card>
      )}
    </div>
  );
};

export default TermsList;