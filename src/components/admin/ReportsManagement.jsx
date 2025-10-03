import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ShieldAlert, Eye, Check, X, User, FileText, Calendar } from 'lucide-react';

const ReportsManagement = ({ allReports, allUsers, onUpdate }) => {
  const { toast } = useToast();

  const getUserName = (userId) => {
    const user = allUsers.find(u => u.id === userId);
  return user ? user.name : "Mohamed Rachid Belhadj";
  };

  const handleReportAction = (reportId, action) => {
    const reports = JSON.parse(localStorage.getItem('coaching_dict_reports') || '[]');
    let updatedReports = [...reports];
    let message = '';
    
    if (action === 'validate') {
      updatedReports = updatedReports.filter(r => r.id !== reportId);
      message = 'Signalement validé et archivé.';
    } else if (action === 'ignore') {
       updatedReports = updatedReports.map(r => r.id === reportId ? {...r, status: 'ignored'} : r);
       message = 'Signalement ignoré.';
    }

    localStorage.setItem('coaching_dict_reports', JSON.stringify(updatedReports));
    onUpdate();
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

  const pendingReports = allReports.filter(r => r.status === 'pending');

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Gestion des Signalements</CardTitle>
        <CardDescription>Examinez et traitez les signalements des utilisateurs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingReports.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="font-medium">Aucun signalement en attente. Bravo !</p>
              <p className="text-sm">La communauté se comporte bien.</p>
            </div>
          ) : (
            pendingReports.map(report => (
              <Card key={report.id} className="p-4 bg-background/50 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1 space-y-2">
                     <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{report.reason}</h3>
                        {getStatusBadge(report.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center"><FileText className="inline h-4 w-4 mr-1.5" /> Terme: <Link to={`/fiche/${report.termTitle.toLowerCase().replace(/\s+/g, '-')}`} className="font-medium text-primary hover:underline ml-1">{report.termTitle}</Link></span>
                      <span className="flex items-center"><User className="inline h-4 w-4 mr-1.5" /> Signalé par: <span className="font-medium ml-1">{getUserName(report.reporterId)}</span></span>
                      <span className="flex items-center"><Calendar className="inline h-4 w-4 mr-1.5" /> Le {new Date(report.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
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
  );
};

export default ReportsManagement;