import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import AuthorCard from '@/components/authors/AuthorCard';

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [professionFilter, setProfessionFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('popularity');
  const [professions, setProfessions] = useState([]);

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    const allTerms = JSON.parse(localStorage.getItem('coaching_dict_terms') || '[]');
    
    const authorUsers = allUsers.filter(user => user.role === 'auteur' && user.status === 'active');

    const authorsWithStats = authorUsers.map(author => {
      const termsAdded = allTerms.filter(term => term.authorId === author.id).length;
      const score = termsAdded * 10;
      return { ...author, termsAdded, score };
    });

    setAuthors(authorsWithStats);
    setFilteredAuthors(authorsWithStats);

    const uniqueProfessions = [...new Set(authorsWithStats.map(a => a.professionalStatus).filter(Boolean))];
    setProfessions(uniqueProfessions);
  }, []);

  useEffect(() => {
    let result = [...authors];

    if (searchQuery) {
      result = result.filter(author =>
        author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (professionFilter !== 'all') {
      result = result.filter(author => author.professionalStatus === professionFilter);
    }

    if (sortOrder === 'popularity') {
      result.sort((a, b) => b.score - a.score);
    } else if (sortOrder === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    setFilteredAuthors(result);
  }, [searchQuery, professionFilter, sortOrder, authors]);

  return (
    <>
      <Helmet>
        <title>Nos Auteurs - Dictionnaire Collaboratif du Coaching</title>
        <meta name="description" content="Découvrez les auteurs et contributeurs qui enrichissent le dictionnaire collaboratif du coaching." />
      </Helmet>
      <div className="min-h-screen creative-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl md:text-6xl">
              Nos <span className="creative-gradient-text">Auteurs</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Rencontrez la communauté d'experts qui partagent leur savoir et enrichissent le dictionnaire.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 mb-8 p-4 border rounded-lg bg-card"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un auteur par nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <div className="flex gap-4">
              <Select value={professionFilter} onValueChange={setProfessionFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-12">
                  <SelectValue placeholder="Filtrer par profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les professions</SelectItem>
                  {professions.map(prof => <SelectItem key={prof} value={prof}>{prof}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full md:w-[200px] h-12">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularité</SelectItem>
                  <SelectItem value="name_asc">Nom (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Nom (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAuthors.map((author, index) => (
              <motion.div
                key={author.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <AuthorCard author={author} />
              </motion.div>
            ))}
          </div>
          {filteredAuthors.length === 0 && (
            <div className="text-center col-span-full py-16">
              <p className="text-muted-foreground">Aucun auteur ne correspond à votre recherche.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Authors;