import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Edit, BarChart2, Star } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import UserTermsList from '@/components/dashboard/UserTermsList';

const Dashboard = () => {
  const { user } = useAuth();
  const [userTerms, setUserTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allTerms = JSON.parse(localStorage.getItem('coaching_dict_terms') || '[]');
    setUserTerms(allTerms.filter(term => term.authorId === user.id));
    setLoading(false);
  }, [user.id]);

  const statsData = {
    published: userTerms.filter(t => t.status === 'published').length,
    review: userTerms.filter(t => t.status === 'review').length,
    draft: userTerms.filter(t => t.status === 'draft').length,
  };
  
  const contributionScore = statsData.published * 10 + userTerms.reduce((acc, term) => acc + (term.likes || 0), 0);

  const statCards = [
    { title: 'Termes Publiés', value: statsData.published, icon: FileText, color: 'from-green-500 to-green-400', delay: 0.1 },
    { title: 'En Révision', value: statsData.review, icon: Edit, color: 'from-yellow-500 to-yellow-400', delay: 0.2 },
    { title: 'Brouillons', value: statsData.draft, icon: BarChart2, color: 'from-blue-500 to-blue-400', delay: 0.3 },
    { title: 'Score', value: contributionScore, icon: Star, color: 'from-primary to-purple-400', delay: 0.4 },
  ];

  return (
    <>
      <Helmet>
        <title>Tableau de bord - Dictionnaire Collaboratif</title>
        <meta name="description" content="Votre tableau de bord personnel pour gérer vos contributions." />
      </Helmet>
      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">Bonjour, <span className="creative-gradient-text">{user.name}</span> !</h1>
            <p className="text-muted-foreground text-lg">Bienvenue sur votre tableau de bord personnel.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map(stat => <StatCard key={stat.title} {...stat} />)}
          </div>
          
          <UserTermsList userTerms={userTerms} loading={loading} user={user} />

        </div>
      </div>
    </>
  );
};

export default Dashboard;