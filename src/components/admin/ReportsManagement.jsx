import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchReports,
  selectAllReports,
  selectReportsLoading,
  updateReport,
} from "@/features/reports/reportsSlice";
import {
  ShieldAlert,
  Eye,
  Check,
  X,
  User,
  FileText,
  Calendar,
} from "lucide-react";

const ReportsManagement = ({ allUsers, loadingOverride, onUpdate }) => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reports = useSelector(selectAllReports);
  const reportsLoading = useSelector(selectReportsLoading);
  const loading =
    typeof loadingOverride === "boolean" ? loadingOverride : reportsLoading;
  const knownUsers = useMemo(
    () => (Array.isArray(allUsers) ? allUsers : []),
    [allUsers]
  );
  const [actionState, setActionState] = useState({});

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const getUserName = (report) => {
    if (report.firstname && report.lastname) {
      return `${report.firstname} ${report.lastname}`;
    }
    if (report.reporter_email) {
      return report.reporter_email;
    }

    const reporterId = report.reporter_id || report.reporterId;
    if (reporterId) {
      const match = knownUsers.find((user) =>
        [user.id, user.user_id, user.userId, user.uuid]
          .filter((candidate) => candidate !== undefined && candidate !== null)
          .some((candidate) => String(candidate) === String(reporterId))
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
        if (match.username) return match.username;
        if (match.name) return match.name;
        if (match.email) return match.email;
      }
    }

    return "Utilisateur inconnu";
  };

  const handleViewTerm = (report) => {
    const termSlug = report.term_slug || report.termSlug || null;
    const termId = report.term_id || report.termId || null;

    if (termSlug) {
      navigate(`/fiche/${termSlug}`);
      return;
    }

    if (termId) {
      navigate(`/fiche/${termId}`);
      return;
    }

    toast({
      title: "Terme introuvable",
      description: "Ce signalement ne pointe vers aucun terme identifié.",
      variant: "destructive",
    });
  };

  const handleReportAction = async (reportId, action) => {
    try {
      let message = "";
      let status = "";

      if (action === "validate") {
        status = "resolved";
        message = "Signalement validé et résolu.";
      } else if (action === "ignore") {
        status = "ignored";
        message = "Signalement ignoré.";
      } else {
        return;
      }

      setActionState((prev) => ({ ...prev, [reportId]: true }));

      await dispatch(updateReport({ id: reportId, data: { status } })).unwrap();

      if (typeof onUpdate === "function") {
        onUpdate();
      }

      toast({
        title: "Action effectuée",
        description: message,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du signalement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le signalement.",
        variant: "destructive",
      });
    } finally {
      setActionState((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return <Badge variant="destructive">En attente</Badge>;
      case "resolved":
        return <Badge variant="success">Résolu</Badge>;
      case "ignored":
        return <Badge variant="secondary">Ignoré</Badge>;
      default:
        return <Badge variant="outline">{status || "N/A"}</Badge>;
    }
  };

  const pendingReports = reports.filter(
    (report) => report.status === "pending"
  );

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Gestion des Signalements</CardTitle>
        <CardDescription>
          Examinez et traitez les signalements des utilisateurs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chargement des signalements...
              </p>
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="font-medium">
                Aucun signalement en attente. Bravo !
              </p>
              <p className="text-sm">La communauté se comporte bien.</p>
            </div>
          ) : (
            pendingReports.map((report) => (
              <Card
                key={report.id}
                className="p-4 bg-background/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{report.reason}</h3>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <FileText className="inline h-4 w-4 mr-1.5" /> Terme :{" "}
                        <button
                          type="button"
                          onClick={() => handleViewTerm(report)}
                          className="font-medium text-primary hover:underline ml-1"
                        >
                          {report.term_title || "Terme inconnu"}
                        </button>
                      </span>
                      <span className="flex items-center">
                        <User className="inline h-4 w-4 mr-1.5" /> Signalé par :{" "}
                        <span className="font-medium ml-1">
                          {getUserName(report)}
                        </span>
                      </span>
                      <span className="flex items-center">
                        <Calendar className="inline h-4 w-4 mr-1.5" /> Le{" "}
                        {new Date(report.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    {report.details && (
                      <p className="text-sm border-l-4 pl-4 py-2 bg-muted/50 mt-2">
                        "{report.details}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTerm(report)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> Voir le terme
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Boolean(actionState[report.id])}
                      onClick={() => handleReportAction(report.id, "validate")}
                    >
                      <Check className="mr-2 h-4 w-4 text-green-500" /> Valider
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Boolean(actionState[report.id])}
                      onClick={() => handleReportAction(report.id, "ignore")}
                    >
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
