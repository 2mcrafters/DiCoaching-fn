import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Edit,
  Search,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAllTerms,
  fetchTerms,
  updateTerm as updateTermThunk,
  deleteTerm as deleteTermThunk,
} from "@/features/terms/termsSlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const TermsManagement = ({ allUsers, onUpdate }) => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const terms = useSelector(selectAllTerms);
  const loading = useSelector((state) => state.terms.loading);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [actionState, setActionState] = useState({});
  const [termPendingDelete, setTermPendingDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchTerms({ limit: 10000 }));
  }, [dispatch]);

  const knownUsers = useMemo(
    () => (Array.isArray(allUsers) ? allUsers : []),
    [allUsers]
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Publié
          </Badge>
        );
      case "review":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            En révision
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            Brouillon
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAuthorName = (term) => {
    const authorId = term.authorId || term.author_id;
    const fallbackName =
      term.authorName || term.author_name || "Mohamed Rachid Belhadj";

    if (!authorId) return fallbackName;

    const match = knownUsers.find(
      (user) => String(user.id) === String(authorId)
    );
    if (match) {
      const composed = [
        match.firstname || match.firstName || match.first_name,
        match.lastname || match.lastName || match.last_name,
      ]
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter(Boolean)
        .join(" ");
      if (composed) return composed;
      if (match.name) return match.name;
      if (match.username) return match.username;
    }

    return fallbackName;
  };

  const getTermId = (term) => term.id || term._id || term.slug;
  const getTermTitle = (term) =>
    term.term || term.terme || term.title || "Terme sans titre";
  const getTermCategory = (term) =>
    term.category || term.categorie || "Coaching";
  const getTermDate = (term) =>
    term.createdAt || term.created_at || term.created_at_fr || null;
  const getTermStatus = (term) => term.status || "draft";

  const buildFilterPredicate = (query, status) => {
    const trimmedQuery = (query || "").trim().toLowerCase();
    const hasQuery = trimmedQuery.length > 0;
    const filterByStatus = status && status !== "all";

    return (term) => {
      const title = getTermTitle(term).toLowerCase();
      const category = getTermCategory(term).toLowerCase();
      const matchesQuery =
        !hasQuery ||
        title.includes(trimmedQuery) ||
        category.includes(trimmedQuery);
      const matchesStatus = !filterByStatus || getTermStatus(term) === status;
      return matchesQuery && matchesStatus;
    };
  };

  const filteredTerms = useMemo(() => {
    const predicate = buildFilterPredicate(searchQuery, statusFilter);
    return (terms || []).filter(predicate);
  }, [terms, searchQuery, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTerms.length / itemsPerPage)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTerms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTerms.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTerms, currentPage, itemsPerPage]);

  const viewTerm = (term) => {
    const termId = getTermId(term);
    const termSlug = term.slug || term.termSlug || null;
    navigate(termSlug ? `/fiche/${termSlug}` : `/fiche/${termId}`);
  };

  const editTerm = (term) => {
    const termId = getTermId(term);
    const termSlug = term.slug || term.termSlug || null;
    navigate(termSlug ? `/edit/${termSlug}` : `/edit/${termId}`);
  };

  const handleTermAction = async (termId, action) => {
    try {
      let newStatus = "";
      let message = "";

      if (action === "approve") {
        newStatus = "published";
        message = "Le terme a été publié.";
      } else if (action === "reject") {
        newStatus = "draft";
        message = "Le terme a été renvoyé en brouillon.";
      } else {
        return;
      }

      setActionState((prev) => ({ ...prev, [termId]: true }));
      await dispatch(
        updateTermThunk({ id: termId, changes: { status: newStatus } })
      ).unwrap();

      if (typeof onUpdate === "function") {
        onUpdate(termId, action);
      }

      toast({
        title: action === "approve" ? "Terme approuvé !" : "Terme rejeté",
        description: message,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du terme:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le terme.",
        variant: "destructive",
      });
    } finally {
      setActionState((prev) => ({ ...prev, [termId]: false }));
    }
  };

  const handleDeleteTerm = async (termId) => {
    try {
      setActionState((prev) => ({ ...prev, [`delete-${termId}`]: true }));
      await dispatch(deleteTermThunk(termId)).unwrap();

      toast({
        title: "Terme supprimé",
        description: "Le terme a été supprimé avec succès.",
      });

      if (typeof onUpdate === "function") {
        onUpdate(termId, "delete");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du terme:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le terme.",
        variant: "destructive",
      });
    } finally {
      setActionState((prev) => ({ ...prev, [`delete-${termId}`]: false }));
    }
  };

  const confirmDelete = async () => {
    if (!termPendingDelete) return;
    const termId = getTermId(termPendingDelete);
    await handleDeleteTerm(termId);
    setTermPendingDelete(null);
  };

  const handleItemsPerPageChange = (value) => {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setItemsPerPage(parsed);
      setCurrentPage(1);
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const delta = 2;

    for (
      let i = Math.max(1, currentPage - delta);
      i <= totalPages && i <= currentPage + delta;
      i += 1
    ) {
      pageNumbers.push(i);
    }

    const showPrevEllipsis = pageNumbers[0] > 2;
    const showNextEllipsis =
      pageNumbers[pageNumbers.length - 1] < totalPages - 1;

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className="cursor-pointer"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              aria-disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </PaginationPrevious>
          </PaginationItem>

          {pageNumbers[0] > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>
                  1
                </PaginationLink>
              </PaginationItem>
              {showPrevEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {pageNumbers.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                isActive={currentPage === pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {showNextEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              className="cursor-pointer"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              aria-disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const pendingDeleteId = termPendingDelete
    ? getTermId(termPendingDelete)
    : null;
  const isDeletingPending =
    pendingDeleteId != null &&
    Boolean(actionState[`delete-${pendingDeleteId}`]);

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Gestion des termes</CardTitle>
              <CardDescription>
                Modérez et gérez les termes soumis par les contributeurs.
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <div className="relative flex-1 sm:min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par terme ou catégorie..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Chargement des termes...
                </p>
              </div>
            ) : paginatedTerms.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-medium mb-2">Aucun terme trouvé</h3>
                <p className="text-sm">
                  Essayez de modifier vos filtres de recherche.
                </p>
              </div>
            ) : (
              paginatedTerms.map((term) => {
                const termId = getTermId(term);
                const title = getTermTitle(term);
                const category = getTermCategory(term);
                const date = getTermDate(term);
                const status = getTermStatus(term);
                const isPending = status === "review";
                const isProcessing = Boolean(actionState[termId]);
                const isDeleting = Boolean(actionState[`delete-${termId}`]);

                return (
                  <div
                    key={termId}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{title}</h4>
                        {getStatusBadge(status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1.5" />
                          {getAuthorName(term)}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          {date
                            ? new Date(date).toLocaleDateString("fr-FR")
                            : ""}
                        </span>
                        <span className="font-medium">
                          Catégorie : {category}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => viewTerm(term)}
                        title="Voir le terme"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => editTerm(term)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isPending && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleTermAction(termId, "approve")}
                            className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50"
                            disabled={isProcessing}
                            title="Approuver"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleTermAction(termId, "reject")}
                            className="text-yellow-600 hover:text-yellow-700 border-yellow-500 hover:bg-yellow-50"
                            disabled={isProcessing}
                            title="Rejeter"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setTermPendingDelete(term)}
                        disabled={isDeleting}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
        {totalPages > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 sm:mb-0">
              <span>Éléments par page :</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
              >
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

      <Dialog
        open={Boolean(termPendingDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingPending) {
            setTermPendingDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le terme{" "}
              <strong>
                {termPendingDelete ? getTermTitle(termPendingDelete) : ""}
              </strong>
              ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTermPendingDelete(null)}
              disabled={isDeletingPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeletingPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TermsManagement;
