import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, UserCheck, ShieldAlert, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminStats = ({ terms, users, reports, modifications }) => {
  const totalUsers = users.length;
  const totalTerms = terms.length;
  const pendingAuthors = users.filter(u => u.role === 'auteur' && u.status === 'pending').length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const pendingModifications = modifications.filter(m => m.status === 'pending').length;

  const stats = [
    { title: 'Utilisateurs', value: totalUsers, icon: Users, color: 'from-blue-500 to-blue-400' },
    { title: 'Termes', value: totalTerms, icon: FileText, color: 'from-green-500 to-green-400' },
    { title: 'Auteurs en attente', value: pendingAuthors, icon: UserCheck, color: 'from-yellow-500 to-yellow-400' },
    { title: 'Signalements', value: pendingReports, icon: ShieldAlert, color: 'from-red-500 to-red-400' },
    { title: 'Modifications', value: pendingModifications, icon: Edit, color: 'from-purple-500 to-purple-400' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className={`bg-gradient-to-br ${stat.color} text-white border-none shadow-lg`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminStats;