import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { addDays } from 'date-fns';

import { useData } from '@/contexts/DataContext';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';

const ITEMS_PER_PAGE = 20;

const Search = () => {
  const { terms, loading, error } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedAuthor, setSelectedAuthor] = useState(searchParams.get('author') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || (searchQuery ? 'relevance' : 'alphabetical'));
  const [dateRange, setDateRange] = useState({
    from: searchParams.get('from') ? new Date(searchParams.get('from')) : undefined,
    to: searchParams.get('to') ? new Date(searchParams.get('to')) : undefined,
  });
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const publishedTerms = useMemo(() => terms.filter(term => term.status === 'published'), [terms]);

  const allUsers = useMemo(() => JSON.parse(localStorage.getItem('coaching_dict_users') || '[]'), []);
  
  const authors = useMemo(() => {
    const uniqueAuthorIds = new Set(publishedTerms.map(term => term.authorId));
    const authorList = Array.from(uniqueAuthorIds).map(authorId => {
      if (authorId === 'user-api') {
        return { id: 'user-api', name: 'Mohamed Rachid Belhadj' };
      }
      const user = allUsers.find(u => u.id === authorId);
      return user ? { id: user.id, name: user.name } : null;
    }).filter(Boolean);
    return [{ id: 'all', name: 'Tous les auteurs' }, ...authorList];
  }, [publishedTerms, allUsers]);

  const categories = useMemo(() => {
    return ['all', 'Coaching'];
  }, []);

  const filteredTerms = useMemo(() => {
    let filtered = [...publishedTerms];

    // Apply standard filters first
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(term => term.category === selectedCategory);
    }
    if (selectedAuthor !== 'all') {
      filtered = filtered.filter(term => term.authorId === selectedAuthor);
    }
    if (dateRange.from) {
        filtered = filtered.filter(term => new Date(term.createdAt) >= dateRange.from);
    }
    if (dateRange.to) {
        filtered = filtered.filter(term => new Date(term.createdAt) <= addDays(dateRange.to, 1));
    }

    // Apply search query and relevance scoring
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered
        .map(term => {
          let score = 0;
          if (term.term.toLowerCase().includes(query)) score = 4;
          else if (term.definition?.toLowerCase().includes(query)) score = 3;
          else if (term.exemples?.some(ex => ex.text.toLowerCase().includes(query))) score = 2;
          else if (term.sources?.some(src => src.text.toLowerCase().includes(query))) score = 1;
          
          return { ...term, score };
        })
        .filter(term => term.score > 0);
    } else {
      // Add a default score if no search query
      filtered = filtered.map(term => ({ ...term, score: 0 }));
    }

    // Apply sorting
    const allLikes = JSON.parse(localStorage.getItem('coaching_dict_likes') || '{}');

    filtered.sort((a, b) => {
      if (sortBy === 'relevance' && searchQuery.trim()) {
        if (a.score !== b.score) return b.score - a.score;
      }
      
      // Secondary sorting for relevance or primary for other options
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'likes':
          const likesA = (allLikes[a.id] || []).length;
          const likesB = (allLikes[b.id] || []).length;
          return likesB - likesA;
        case 'alphabetical':
        default:
          return a.term.localeCompare(b.term);
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedAuthor, sortBy, dateRange, publishedTerms]);

  const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE);
  const paginatedTerms = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTerms.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTerms, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };
  
  useEffect(() => {
    if (searchQuery.trim() && sortBy !== 'relevance') {
      setSortBy('relevance');
    } else if (!searchQuery.trim() && sortBy === 'relevance') {
      setSortBy('alphabetical');
    }
  }, [searchQuery, sortBy]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedAuthor !== 'all') params.set('author', selectedAuthor);
    
    // Only set sort if it's not the default
    const defaultSort = searchQuery.trim() ? 'relevance' : 'alphabetical';
    if (sortBy !== defaultSort) params.set('sort', sortBy);

    if (dateRange.from) params.set('from', dateRange.from.toISOString().split('T')[0]);
    if (dateRange.to) params.set('to', dateRange.to.toISOString().split('T')[0]);
    if (currentPage > 1) params.set('page', currentPage);
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, selectedAuthor, sortBy, dateRange, currentPage, setSearchParams]);


  const getAuthorName = (authorId) => {
    if (authorId === 'user-api') return 'Mohamed Rachid Belhadj';
    const author = allUsers.find(u => u.id === authorId);
    return author ? author.name : 'Inconnu';
  };
  
  return (
    <>
      <Helmet>
        <title>Recherche - Dictionnaire Digital Collaboratif du Coaching</title>
        <meta name="description" content="Recherchez et explorez les termes du dictionnaire collaboratif du coaching. Filtrez par catégorie et trouvez les concepts qui vous intéressent." />
      </Helmet>

      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Recherche dans le <span className="creative-gradient-text">dictionnaire</span>
            </h1>
            <p className="text-muted-foreground">
              Explorez les concepts et techniques du coaching
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-full lg:w-1/4 xl:w-1/5"
            >
              <SearchFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedAuthor={selectedAuthor}
                setSelectedAuthor={setSelectedAuthor}
                sortBy={sortBy}
                setSortBy={setSortBy}
                dateRange={dateRange}
                setDateRange={setDateRange}
                authors={authors}
                categories={categories}
                setCurrentPage={setCurrentPage}
              />
            </motion.aside>

            <main className="flex-1">
              <SearchResults
                paginatedTerms={paginatedTerms}
                loading={loading}
                error={error}
                filteredTermsLength={filteredTerms.length}
                totalPages={totalPages}
                currentPage={currentPage}
                handlePageChange={handlePageChange}
                getAuthorName={getAuthorName}
              />
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Search;