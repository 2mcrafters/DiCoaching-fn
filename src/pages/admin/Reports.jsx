import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ShieldAlert, Eye, Check, X, User, FileText } from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const allReports = JSON.parse(localStorage.getItem('coaching_dict_reports') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    setReports(allReports.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setUsers(allUsers);
  }, []);

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Mohamed Rachid Belhadj";
  };

  const handleReportAction = (reportId, action) => {
    let updatedReports = [...reports];
    let message = '';
    
    if (action === 'validate') {
      updatedReports = updatedReports.filter(r => r.id !== reportId);
      message = 'Signalement validé et archivé.';
    } else if (action === 'ignore') {
       updatedReports = updatedReports.map(r => r.id === reportId ? {...r, status: 'ignored'} : r);
       message = 'Signalement ignoré.';
    }

    setReports(updatedReports);
    localStorage.setItem('coaching_dict_reports', JSON.stringify(updatedReports));
    toast({
      title: 'Action effectuée',
      description: message,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">En attente</Badge>;
      case 'ignored':
        return <Badge variant="secondary">Ignoré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Gestion des Signalements - Administration</title>
        <meta name="description" content="Gérez les signalements des utilisateurs sur les termes du dictionnaire." />
      </Helmet>
      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Signalements</h1>
            <p className="text-muted-foreground">Examinez et traitez les signalements des utilisateurs.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Signalements en attente</CardTitle>
                <CardDescription>Liste de tous les signalements qui requièrent votre attention.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <ShieldAlert className="h-12 w-12 mx-auto mb-4" />
                      <p>Aucun signalement en attente. Bravo !</p>
                    </div>
                  ) : (
                    reports.map(report => (
                      <Card key={report.id} className="p-4">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div className="flex-1 space-y-2">
                             <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{report.reason}</h3>
                                {getStatusBadge(report.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <FileText className="inline h-4 w-4 mr-1" /> Terme: <Link to={`/fiche/${report.termTitle.toLowerCase().replace(/\s+/g, '-')}`} className="font-medium text-primary hover:underline">{report.termTitle}</Link>
                            </p>
                            <p className="text-sm text-muted-foreground">
                               <User className="inline h-4 w-4 mr-1" /> Signalé par: <span className="font-medium">{getUserName(report.reporterId)}</span>
                            </p>
                             <p className="text-sm text-muted-foreground">
                              Le {new Date(report.createdAt).toLocaleString('fr-FR')}
                            </p>
                            {report.details && (
                                <p className="text-sm border-l-4 pl-4 py-2 bg-muted/50 mt-2">"{report.details}"</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-4 md:mt-0">
                             <Button variant="outline" size="sm" asChild>
                                <Link to={`/edit/${report.termTitle.toLowerCase().replace(/\s+/g, '-')}`}><Eye className="mr-2 h-4 w-4" /> Voir/Modifier</Link>
                             </Button>
                             <Button variant="outline" size="sm" onClick={() => handleReportAction(report.id, 'validate')}>
                                <Check className="mr-2 h-4 w-4 text-green-500" /> Valider
                             </Button>
                             <Button variant="outline" size="sm" onClick={() => handleReportAction(report.id, 'ignore')}>
                                <X className="mr-2 h-4 w-4 text-red-500" /> Ignorer
                             </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Reports;