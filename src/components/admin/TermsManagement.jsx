import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { FileText, CheckCircle, XCircle, Eye, Trash2, Edit, Search, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';

const TermsManagement = ({ allTerms, allUsers, onUpdate }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Publié</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">En révision</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAuthorName = (authorId) => {
    const author = allUsers.find(u => u.id === authorId);
    return author ? author.name : 'Utilisateur inconnu';
  };

  const handleTermAction = (termId, action) => {
    const terms = JSON.parse(localStorage.getItem('coaching_dict_terms') || '[]');
    const updatedTerms = terms.map(term => {
      if (term.id === termId) {
        switch (action) {
          case 'approve':
            return { ...term, status: 'published', updatedAt: new Date().toISOString() };
          case 'reject':
            return { ...term, status: 'draft', updatedAt: new Date().toISOString() };
          default:
            return term;
        }
      }
      return term;
    });
    localStorage.setItem('coaching_dict_terms', JSON.stringify(updatedTerms));
    onUpdate();
    toast({
      title: action === 'approve' ? "Terme approuvé !" : "Terme rejeté",
      description: action === 'approve' ? "Le terme a été publié." : "Le terme a été renvoyé en brouillon.",
    });
  };

  const handleDeleteTerm = (termId) => {
    const terms = JSON.parse(localStorage.getItem('coaching_dict_terms') || '[]');
    const updatedTerms = terms.filter(term => term.id !== termId);
    localStorage.setItem('coaching_dict_terms', JSON.stringify(updatedTerms));
    onUpdate();
    toast({
      title: "Terme supprimé !",
      description: "Le terme a été supprimé définitivement.",
      variant: "destructive"
    });
  };

  const filteredTerms = useMemo(() => {
    let terms = allTerms
      .filter(term => statusFilter === 'all' || term.status === statusFilter)
      .filter(term =>
        searchQuery.trim() === '' ||
        (term.term && term.term.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (term.category && term.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    return terms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allTerms, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredTerms.length / itemsPerPage);

  const paginatedTerms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTerms.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTerms, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    const ellipsis = <PaginationItem key="ellipsis"><PaginationEllipsis /></PaginationItem>;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      pageNumbers.push(
        <PaginationItem key={1}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (currentPage > 3) {
        pageNumbers.push(React.cloneElement(ellipsis, {key: "start-ellipsis"}));
      }

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if(currentPage <= 2) {
        startPage = 2;
        endPage = 4;
      }
      if(currentPage >= totalPages - 1) {
          startPage = totalPages - 3;
          endPage = totalPages - 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push(React.cloneElement(ellipsis, {key: "end-ellipsis"}));
      }
      
      pageNumbers.push(
        <PaginationItem key={totalPages}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return (
       <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} />
          </PaginationItem>
          {pageNumbers}
          <PaginationItem>
            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Gestion des termes</CardTitle>
        <CardDescription>Modérez et gérez les termes soumis par les contributeurs.</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par terme ou catégorie..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
              <SelectItem value="review">En révision</SelectItem>
              <SelectItem value="published">Publiés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paginatedTerms.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-medium mb-2">Aucun terme trouvé</h3>
              <p className="text-sm">Essayez de modifier vos filtres de recherche.</p>
            </div>
          ) : (
            paginatedTerms.map((term) => (
              <div key={term.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors">
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-lg">{term.term}</h4>
                    {getStatusBadge(term.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center"><User className="h-4 w-4 mr-1.5" />{getAuthorName(term.authorId)}</span>
                    <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5" />{new Date(term.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span className="font-medium">Catégorie: {term.category}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button asChild variant="outline" size="icon"><Link to={`/fiche/${term.slug}`}><Eye className="h-4 w-4" /></Link></Button>
                  <Button asChild variant="outline" size="icon"><Link to={`/edit/${term.slug}`}><Edit className="h-4 w-4" /></Link></Button>
                  {term.status === 'review' && (
                    <>
                      <Button variant="outline" size="icon" onClick={() => handleTermAction(term.id, 'approve')} className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50"><CheckCircle className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => handleTermAction(term.id, 'reject')} className="text-yellow-600 hover:text-yellow-700 border-yellow-500 hover:bg-yellow-50"><XCircle className="h-4 w-4" /></Button>
                    </>
                  )}
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteTerm(term.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
       {totalPages > 0 && (
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 sm:mb-0">
              <span>Éléments par page:</span>
              <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                  </SelectContent>
              </Select>
          </div>
          {renderPagination()}
        </CardFooter>
      )}
    </Card>
  );
};

export default TermsManagement;