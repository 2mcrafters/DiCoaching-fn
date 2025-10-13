import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import SharePopover from '@/components/SharePopover';
import { Calendar, User, BookOpen, Loader2, AlertTriangle, Share2, ArrowRight } from 'lucide-react';

const SearchResults = ({
  paginatedTerms,
  loading,
  error,
  filteredTermsLength,
  totalPages,
  currentPage,
  handlePageChange,
  getAuthorName,
  searchQuery,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="mb-4 flex items-center justify-between">
        {!loading && !error && (
          <p className="text-muted-foreground">
            {filteredTermsLength} résultat{filteredTermsLength !== 1 ? "s" : ""}{" "}
            trouvé{filteredTermsLength !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6 text-center text-destructive-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
          </CardContent>
        </Card>
      ) : paginatedTerms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun résultat trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos critères de recherche ou explorez les
              catégories.
            </p>
            <Link to="/submit">
              <Button>Contribuer au dictionnaire</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {paginatedTerms.map((term, index) => (
              <motion.div
                key={term.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="h-full flex flex-col group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-transparent hover:border-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 font-bold text-primary">
                          <Link
                            to={`/fiche/${term.slug}`}
                            className="hover:underline"
                          >
                            {term.term}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{term.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-base line-clamp-3 h-[72px]">
                      {term.definition}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="truncate">
                        {getAuthorName(term.authorId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(term.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center gap-2">
                    <Link to={`/fiche/${term.slug}`} className="flex-1">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full group-hover:bg-primary/90 transition-colors"
                      >
                        Lire la suite
                        <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <SharePopover
                      url={`${window.location.origin}/fiche/${term.slug}`}
                      title={term.term}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-9"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </SharePopover>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="font-medium text-sm p-2">
                      Page {currentPage} sur {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default SearchResults;