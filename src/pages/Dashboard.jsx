import React, { useMemo, useEffect, useState, useCallback } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Edit,
  BarChart2,
  Star,
  Heart,
  BookOpen,
  CheckCircle,
  Loader2,
  Plus,
  AlertTriangle,
  X,
  Trash2,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import UserTermsList from "@/components/dashboard/UserTermsList";
import SubmitFormSection from "@/components/submit/SubmitFormSection";
import { useDispatch, useSelector } from "react-redux";
import { fetchTerms, selectAllTerms } from "@/features/terms/termsSlice";
import {
  fetchUserStats,
  selectUserStats,
  selectStatsLoading,
} from "@/features/dashboard/dashboardStatsSlice";
import {
  fetchModifications,
  selectAllModifications,
} from "@/features/modifications/modificationsSlice";
import { sanitizeModificationChanges } from "@/lib/modifications";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { user, hasAuthorPermissions } = useAuth();
  const { toast } = useToast();
  const dispatch = useDispatch();
  const allTerms = useSelector(selectAllTerms);
  const userStats = useSelector(selectUserStats);
  const loading = useSelector(selectStatsLoading);
  const allModifications = useSelector(selectAllModifications);
  const modificationsLoading = useSelector(
    (state) => state.modifications?.loading || false
  );

  useEffect(() => {
    // Fetch user stats from backend for accurate counts
    if (user?.id) {
      dispatch(fetchUserStats(user.id));
    }

    // Fetch terms for the list display if needed
    if (!allTerms || allTerms.length === 0) {
      dispatch(fetchTerms({ limit: 10000 }));
    }
  }, [dispatch, user?.id, allTerms?.length]);

  const isResearcher =
    user?.role === "chercheur" || user?.role === "researcher";
  const isAuthor =
    typeof hasAuthorPermissions === "function"
      ? hasAuthorPermissions()
      : user?.role === "auteur" || user?.role === "author";

  useEffect(() => {
    if (isResearcher && user?.id) {
      dispatch(fetchModifications());
    }
  }, [dispatch, isResearcher, user?.id]);

  const [activeTab, setActiveTab] = useState(isResearcher ? "liked" : null);

  useEffect(() => {
    if (isResearcher) {
      setActiveTab((prev) => prev || "liked");
    } else {
      setActiveTab(null);
    }
  }, [isResearcher]);

  const userTerms = useMemo(() => {
    return (allTerms || []).filter(
      (t) => String(t.authorId) === String(user.id)
    );
  }, [allTerms, user?.id]);

  // Fetch comprehensive dashboard statistics from database
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user?.id) return;

      setStatsLoading(true);
      try {
        const apiService = await import("@/services/api");
        const data = await apiService.default.getDashboardStats();
        console.log("📊 Dashboard Stats Received:", data);
        setDashboardStats(data);
      } catch (error) {
        console.error("❌ Error fetching dashboard stats:", error);
        setDashboardStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user?.id]);

  // Calculate activity metrics from database stats or fallback to local
  const activityMetrics = useMemo(() => {
    if (dashboardStats) {
      return {
        published: dashboardStats.terms?.byStatus?.published || 0,
        draft: dashboardStats.terms?.byStatus?.draft || 0,
        pending: dashboardStats.terms?.byStatus?.pending || 0,
        rejected: dashboardStats.terms?.byStatus?.rejected || 0,
        review: dashboardStats.terms?.byStatus?.pending || 0, // pending is review
        totalActivities: dashboardStats.activities?.total || 0,
        totalLikes: dashboardStats.likes?.received || 0,
        publishedPercentage: dashboardStats.terms?.publishedPercentage || 0,
      };
    }

    // Fallback to local calculation
    const published = userTerms.filter((t) => t.status === "published").length;
    const review = userTerms.filter((t) => t.status === "review").length;
    const draft = userTerms.filter((t) => t.status === "draft").length;
    const rejected = userTerms.filter((t) => t.status === "rejected").length;
    const total = userTerms.length;

    return {
      published,
      review,
      draft,
      rejected,
      total,
      totalLikes: 0, // Will be fetched separately or from stats
      totalActivities:
        total + (isResearcher ? userStats.total_modifications || 0 : 0),
      publishedPercentage:
        total > 0 ? Math.round((published / total) * 100) : 0,
    };
  }, [userTerms, isResearcher, userStats, dashboardStats]);

  // Use backend stats for cards, fallback to computed stats if needed
  const baseStatsData = useMemo(() => {
    if (isResearcher) {
      // Researcher-specific stats from database or fallback
      return {
        liked: dashboardStats?.likes?.given || userStats.terms_liked || 0,
        modifications:
          dashboardStats?.decisions?.made || userStats.total_modifications || 0,
        approved:
          dashboardStats?.decisions?.byType?.approved ||
          userStats.approved_modifications ||
          0,
        pending:
          dashboardStats?.decisions?.byType?.pending ||
          userStats.pending_modifications ||
          0,
        reportsCreated: dashboardStats?.reports?.created || 0,
        totalActivities:
          (dashboardStats?.likes?.given || userStats.terms_liked || 0) +
          (dashboardStats?.decisions?.made ||
            userStats.total_modifications ||
            0) +
          (dashboardStats?.reports?.created || 0),
      };
    } else {
      // Author-specific stats - prefer database stats over local calculations
      return {
        published:
          dashboardStats?.terms?.byStatus?.published ||
          activityMetrics.published,
        review:
          dashboardStats?.terms?.byStatus?.pending || activityMetrics.review,
        draft: dashboardStats?.terms?.byStatus?.draft || activityMetrics.draft,
        total: dashboardStats?.terms?.total || activityMetrics.total,
        likes: dashboardStats?.likes?.received || activityMetrics.totalLikes,
        likesGiven: dashboardStats?.likes?.given || 0,
        reportsReceived: dashboardStats?.reports?.received || 0,
        totalActivities:
          dashboardStats?.activities?.total || activityMetrics.totalActivities,
        rejected:
          dashboardStats?.terms?.byStatus?.rejected || activityMetrics.rejected,
        commentsMade: dashboardStats?.comments?.made || 0,
        commentsReceived: dashboardStats?.comments?.received || 0,
        contributionScore: dashboardStats?.contributionScore || 0,
      };
    }
  }, [isResearcher, dashboardStats, activityMetrics, userStats]);

  // Special override: For Mohamed Rachid Belhadj (admin) display 1421 published terms
  // Accept both admin@dictionnaire.fr and admin@dictionnairefr (without dot)
  const SPECIAL_EMAILS = new Set([
    "admin@dictionnaire.fr",
    "admin@dictionnairefr",
  ]);
  const isSpecialUser = (() => {
    const email = (user?.email || "").toLowerCase();
    const name = (
      user?.name || `${user?.firstname || ""} ${user?.lastname || ""}`
    )
      .trim()
      .toLowerCase();
    return SPECIAL_EMAILS.has(email) || name === "mohamed rachid belhadj";
  })();

  // Compute a full display name from available fields
  const fullName =
    (
      (user?.firstname || "").trim() +
      " " +
      (user?.lastname || "").trim()
    ).trim() ||
    user?.name ||
    user?.email ||
    "Utilisateur";

  // Create the final stats object with optional overrides
  const statsData = (() => {
    const s = { ...baseStatsData };
    if (!isResearcher && isSpecialUser) {
      const OVERRIDE_PUBLISHED = 1421;
      s.published = OVERRIDE_PUBLISHED;
      // Ensure total is at least as large as published to keep percentages sane
      s.total = Math.max(Number(s.total || 0), OVERRIDE_PUBLISHED);
    }
    return s;
  })();

  const formatDate = useCallback((value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("fr-FR");
  }, []);

  const formatStatus = useCallback((status) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "Approuvée";
      case "pending":
        return "En attente";
      case "rejected":
        return "Rejetée";
      case "implemented":
        return "Implémentée";
      default:
        return status || "—";
    }
  }, []);

  const [likedTerms, setLikedTerms] = useState([]);
  const [likedTermsLoading, setLikedTermsLoading] = useState(false);
  const [userReports, setUserReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingModification, setEditingModification] = useState(null);
  const [isEditModificationDialogOpen, setIsEditModificationDialogOpen] =
    useState(false);
  const [modificationFormData, setModificationFormData] = useState(null);
  const [modificationTermBaseline, setModificationTermBaseline] =
    useState(null);
  const [existingNormalizedChanges, setExistingNormalizedChanges] = useState(
    {}
  );
  const [modificationFormLoading, setModificationFormLoading] = useState(false);
  const [modificationSaving, setModificationSaving] = useState(false);

  const resetModificationState = useCallback(() => {
    setIsEditModificationDialogOpen(false);
    setEditingModification(null);
    setModificationFormData(null);
    setModificationTermBaseline(null);
    setExistingNormalizedChanges({});
    setModificationFormLoading(false);
    setModificationSaving(false);
  }, []);

  const handleEditModification = useCallback(
    async (modification) => {
      if (!modification) return;
      const statusValue = (modification.status || "").toLowerCase();
      if (statusValue && statusValue !== "pending") {
        toast({
          title: "Modification verrouillee",
          description:
            "Seules les propositions en attente peuvent etre modifiees.",
        });
        return;
      }

      setModificationFormData(null);
      setModificationTermBaseline(null);
      setExistingNormalizedChanges({});
      setModificationFormLoading(true);

      try {
        let baseTerm =
          (allTerms || []).find(
            (term) =>
              String(term.id) ===
              String(modification.termId ?? modification.term_id)
          ) || null;

        if (!baseTerm) {
          try {
            const apiService = await import("@/services/api");
            const response = await apiService.default.getTerm(
              modification.termId ?? modification.term_id
            );
            baseTerm = (response && response.data) || response || null;
          } catch (error) {
            console.error("Error fetching term for modification:", error);
          }
        }

        if (!baseTerm) {
          toast({
            title: "Terme introuvable",
            description:
              "Impossible de charger les informations du terme associe.",
            variant: "destructive",
          });
          setModificationFormLoading(false);
          return;
        }

        const baseline = buildTermBaseline(
          baseTerm,
          modification.comment || ""
        );
        const sanitizedChanges = sanitizeModificationChanges(
          modification.changes || {}
        );
        const initialForm = applyChangesToFormData(
          cloneFormData(baseline),
          sanitizedChanges
        );

        setModificationTermBaseline(baseline);
        setModificationFormData(initialForm);
        setExistingNormalizedChanges(
          normalizeChangesForComparison(modification.changes || {})
        );
        setEditingModification(modification);
        setIsEditModificationDialogOpen(true);
      } catch (error) {
        console.error("Error preparing modification for edit:", error);
        toast({
          title: "Erreur",
          description:
            "Impossible de charger la proposition pour modification.",
          variant: "destructive",
        });
      } finally {
        setModificationFormLoading(false);
      }
    },
    [allTerms, toast]
  );

  const handleDeleteModification = useCallback(
    async (modificationId) => {
      if (
        !window.confirm(
          "Etes-vous sur de vouloir supprimer cette modification ?"
        )
      ) {
        return;
      }

      try {
        const apiService = await import("@/services/api");
        await apiService.default.deleteModification(modificationId);
        dispatch(fetchModifications());
        console.log("[Dashboard] Modification deleted");
      } catch (error) {
        console.error("Error deleting modification:", error);
        alert(
          "Erreur lors de la suppression de la modification. Veuillez reessayer."
        );
      }
    },
    [dispatch]
  );

  const handleSaveModification = useCallback(async () => {
    if (
      !editingModification ||
      !modificationTermBaseline ||
      !modificationFormData
    ) {
      return;
    }

    if ((editingModification.status || "").toLowerCase() !== "pending") {
      toast({
        title: "Modification verrouillee",
        description:
          "Cette proposition a deja ete traitee et ne peut plus etre modifiee.",
        variant: "destructive",
      });
      return;
    }

    const updatedComment = (modificationFormData.moderatorComment || "").trim();
    const originalComment = (editingModification.comment || "").trim();

    const changesPayload = computeChangesDiff(
      modificationTermBaseline,
      modificationFormData
    );
    const normalizedNew = normalizeChangesForComparison(changesPayload);
    const noChange =
      JSON.stringify(existingNormalizedChanges) ===
        JSON.stringify(normalizedNew) && originalComment === updatedComment;

    if (noChange) {
      toast({
        title: "Aucune modification",
        description: "Aucun changement detecte.",
      });
      return;
    }

    const payload = {};
    if (Object.keys(changesPayload).length > 0) {
      payload.changes = changesPayload;
    }
    if (originalComment !== updatedComment) {
      payload.comment = updatedComment;
    }

    setModificationSaving(true);
    try {
      const apiService = await import("@/services/api");
      await apiService.default.updateModification(
        editingModification.id,
        payload
      );
      toast({
        title: "Proposition mise a jour",
        description: "Vos ajustements ont ete enregistres.",
      });
      resetModificationState();
      dispatch(fetchModifications());
    } catch (error) {
      console.error("Error updating modification:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre a jour la proposition.",
        variant: "destructive",
      });
      setModificationSaving(false);
    }
  }, [
    editingModification,
    modificationTermBaseline,
    modificationFormData,
    existingNormalizedChanges,
    dispatch,
    toast,
    resetModificationState,
  ]);

  // Fetch liked terms from database for all users
  useEffect(() => {
    const fetchLikedTerms = async () => {
      if (!user?.id) return;

      setLikedTermsLoading(true);
      try {
        const apiService = await import("@/services/api");
        const data = await apiService.default.getUserLikedTerms();
        console.log("❤️ Liked Terms Received:", data);
        setLikedTerms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Error fetching liked terms:", error);
        setLikedTerms([]);
      } finally {
        setLikedTermsLoading(false);
      }
    };

    fetchLikedTerms();
  }, [user?.id]);

  // Fetch user's reports from database (for researchers)
  useEffect(() => {
    const fetchUserReports = async () => {
      if (!user?.id) return;

      // Allow admins to see reports too (for debugging)
      const shouldFetch = isResearcher || user?.role === "admin";
      if (!shouldFetch) return;

      setReportsLoading(true);
      try {
        const apiService = await import("@/services/api");
        const data = await apiService.default.getReports();
        console.log("🚩 All Reports Received:", data);
        console.log("🔍 Current User ID:", user.id, "Role:", user.role);

        // Filter reports created by this user
        const myReports = Array.isArray(data)
          ? data.filter((r) => {
              const reporterId = String(r.reporter_id || r.reporterId);
              const userId = String(user.id);
              console.log(
                `Checking report ${
                  r.id
                }: reporter_id=${reporterId}, user.id=${userId}, match=${
                  reporterId === userId
                }`
              );
              return reporterId === userId;
            })
          : [];

        console.log("✅ Filtered User Reports:", myReports);
        setUserReports(myReports);
      } catch (error) {
        console.error("❌ Error fetching user reports:", error);
        setUserReports([]);
      } finally {
        setReportsLoading(false);
      }
    };

    fetchUserReports();
  }, [user?.id, isResearcher, user?.role]);

  // Handler for editing a report
  const handleEditReport = useCallback((report) => {
    setEditingReport(report);
    setIsEditDialogOpen(true);
  }, []);

  // Handler for deleting a report
  const handleDeleteReport = useCallback(
    async (reportId) => {
      if (
        !window.confirm("Êtes-vous sûr de vouloir supprimer ce signalement ?")
      ) {
        return;
      }

      try {
        const apiService = await import("@/services/api");
        await apiService.default.deleteReport(reportId);

        // Remove from local state
        setUserReports((prev) => prev.filter((r) => r.id !== reportId));

        // Refresh stats
        if (user?.id) {
          dispatch(fetchUserStats(user.id));
        }

        console.log("✅ Report deleted successfully");
      } catch (error) {
        console.error("❌ Error deleting report:", error);
        alert(
          "Erreur lors de la suppression du signalement. Veuillez réessayer."
        );
      }
    },
    [user?.id, dispatch]
  );

  // Handler for saving edited report
  const handleSaveReport = useCallback(
    async (updatedData) => {
      if (!editingReport) return;

      try {
        const apiService = await import("@/services/api");
        await apiService.default.updateReport(editingReport.id, updatedData);

        // Update local state
        setUserReports((prev) =>
          prev.map((r) =>
            r.id === editingReport.id ? { ...r, ...updatedData } : r
          )
        );

        setIsEditDialogOpen(false);
        setEditingReport(null);

        console.log("✅ Report updated successfully");
      } catch (error) {
        console.error("❌ Error updating report:", error);
        alert(
          "Erreur lors de la modification du signalement. Veuillez réessayer."
        );
      }
    },
    [editingReport]
  );

  // Generate appropriate stat cards based on user role (MOVED AFTER likedTerms)
  const statCards = isResearcher
    ? [
        {
          title: "Termes Appréciés",
          value: statsData.liked,
          icon: Heart,
          color: "from-pink-500 to-pink-400",
          delay: 0.1,
          description: "Termes que vous avez aimés",
          tabKey: "liked",
        },
        {
          title: "Modifications Proposées",
          value: statsData.modifications,
          icon: Edit,
          color: "from-yellow-500 to-yellow-400",
          delay: 0.2,
          description: `${statsData.approved} approuvées, ${statsData.pending} en attente`,
          tabKey: "modifications",
        },
        {
          title: "Termes Signalés",
          value: statsData.reportsCreated,
          icon: AlertTriangle,
          color: "from-orange-500 to-orange-400",
          delay: 0.3,
          description: "Signalements que vous avez effectués",
          tabKey: "reports",
        },
        {
          title: "Activités Totales",
          value: statsData.totalActivities,
          icon: BarChart2,
          color: "from-purple-500 to-purple-400",
          delay: 0.4,
          description: `${statsData.liked} likes + ${statsData.modifications} modifications + ${statsData.reportsCreated} signalements`,
          tabKey: "activities",
        },
      ]
    : [
        // Author/Admin stat cards with comprehensive metrics
        {
          title: "Termes Publiés",
          value: statsData.published,
          icon: FileText,
          color: "from-green-500 to-green-400",
          delay: 0.1,
          description: `${(
            (statsData.published / Math.max(statsData.total, 1)) *
            100
          ).toFixed(0)}% de vos termes`,
        },
        {
          title: "Termes Aimés",
          value: likedTerms.length,
          icon: Heart,
          color: "from-pink-500 to-pink-400",
          delay: 0.2,
          description: `Termes que vous avez aimés`,
        },
        {
          title: "Activités Totales",
          value: statsData.totalActivities,
          icon: BarChart2,
          color: "from-blue-500 to-blue-400",
          delay: 0.3,
          description: `${statsData.total} termes créés`,
        },
        {
          title: "Termes Signalés",
          value: statsData.reportsReceived,
          icon: AlertTriangle,
          color: "from-orange-500 to-orange-400",
          delay: 0.4,
          description: "Signalements résolus sur vos termes",
        },
      ];

  const researcherModifications = useMemo(() => {
    if (!isResearcher || !user?.id) return [];
    return (allModifications || []).filter(
      (mod) => String(mod.proposerId) === String(user.id)
    );
  }, [allModifications, isResearcher, user?.id]);

  const researcherTabs = useMemo(
    () => [
      { key: "liked", label: "Termes appréciés" },
      { key: "modifications", label: "Modifications proposées" },
      { key: "reports", label: "Signalements effectués" },
      { key: "activities", label: "Activités totales" },
    ],
    []
  );

  const documentsCount = statsData.documents || 0;

  const scoreBreakdown = useMemo(
    () => [
      {
        metric: "Score global",
        value: statsData.score,
        details: "Calculé à partir des likes et des modifications approuvées.",
      },
      {
        metric: "Termes appréciés",
        value: statsData.liked,
        details: "Nombre total de termes que vous avez aimés.",
      },
      {
        metric: "Modifications approuvées",
        value: statsData.approved,
        details: "Contributions validées par l'équipe.",
      },
      {
        metric: "Modifications en attente",
        value: statsData.pending,
        details: "Contributions en cours de revue.",
      },
    ],
    [statsData.approved, statsData.liked, statsData.pending, statsData.score]
  );

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case "liked":
        if (likedTermsLoading) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de vos termes aimés...
            </div>
          );
        }

        return likedTerms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Terme</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Aimé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {likedTerms.map((term) => (
                  <tr key={term.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div>
                        <div className="text-primary font-semibold">
                          {term.term || "Terme sans titre"}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {term.definition
                            ? term.definition.substring(0, 100) + "..."
                            : ""}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatStatus(term.status)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(term.likedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            Vous n'avez pas encore aimé de terme. Explorez le dictionnaire pour
            commencer votre sélection.
          </div>
        );

      case "reports":
        if (reportsLoading) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de vos signalements...
            </div>
          );
        }

        return userReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Terme signalé</th>
                  <th className="px-4 py-3 text-left">Raison</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {userReports.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link
                        to={
                          report.term_slug ? `/fiche/${report.term_slug}` : "#"
                        }
                        className={
                          report.term_slug
                            ? "text-primary hover:underline"
                            : "text-foreground"
                        }
                      >
                        {report.term_title || report.termTitle || "Terme"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {report.reason || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          report.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : report.status === "reviewed"
                            ? "bg-blue-100 text-blue-800"
                            : report.status === "ignored"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {report.status === "resolved"
                          ? "Résolu"
                          : report.status === "reviewed"
                          ? "Examiné"
                          : report.status === "ignored"
                          ? "Ignoré"
                          : "En attente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(report.created_at || report.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditReport(report)}
                          className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                          title="Éditer le signalement"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                          title="Supprimer le signalement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            Vous n'avez pas encore signalé de terme. Visitez une fiche pour
            signaler un problème.
          </div>
        );

      case "activities":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-pink-50 dark:bg-pink-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <h4 className="font-medium">Termes aimés</h4>
                </div>
                <p className="text-2xl font-bold text-pink-600">
                  {statsData.liked}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Termes que vous appréciez
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Edit className="h-5 w-5 text-yellow-500" />
                  <h4 className="font-medium">Modifications</h4>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {statsData.modifications}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Propositions de modifications
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <h4 className="font-medium">Signalements</h4>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {statsData.reportsCreated}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Termes signalés
                </p>
              </div>
            </div>

            <div className="p-6 border-2 border-primary/20 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-1">
                    Total des activités
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Contribution globale à la plateforme
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary">
                    {statsData.totalActivities}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    activités combinées
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "score":
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Indicateur</th>
                  <th className="px-4 py-3 text-left">Valeur</th>
                  <th className="px-4 py-3 text-left">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {scoreBreakdown.map((row) => (
                  <tr key={row.metric} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.metric}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.value}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "documents":
        return (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              {documentsCount > 0
                ? `Vous avez actuellement ${documentsCount} document${
                    documentsCount > 1 ? "s" : ""
                  } mis à disposition.`
                : "Vous n'avez pas encore partagé de document de recherche."}
            </p>
            <p>
              Utilisez l'espace Documents de recherche pour ajouter vos études,
              ressources ou notes personnelles.
            </p>
            <Link
              to="/documents"
              className="inline-flex items-center text-primary font-medium hover:underline"
            >
              Gérer mes documents
            </Link>
          </div>
        );

      case "modifications":
        if (modificationsLoading) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de vos propositions...
            </div>
          );
        }

        return researcherModifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Terme</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Soumise le</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {researcherModifications.map((modification) => {
                  const pendingStatus =
                    (modification.status || "").toLowerCase() === "pending";
                  return (
                    <tr key={modification.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link
                          to={
                            modification.termSlug
                              ? `/fiche/${modification.termSlug}`
                              : "#"
                          }
                          className={
                            modification.termSlug
                              ? "text-primary hover:underline"
                              : "text-foreground"
                          }
                        >
                          {modification.termTitle ||
                            modification.term_title ||
                            "Terme inconnu"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatStatus(modification.status)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(
                          modification.createdAt || modification.created_at
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditModification(modification)}
                            disabled={!pendingStatus}
                            className={`p-1.5 rounded transition-colors ${
                              pendingStatus
                                ? "hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "opacity-50 cursor-not-allowed text-muted-foreground"
                            }`}
                            title="Editer la modification (uniquement si en attente)"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteModification(modification.id)
                            }
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                            title="Supprimer la modification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            Vous n'avez pas encore propose de modification. Rendez-vous sur une
            fiche pour suggerer une amelioration.
          </div>
        );
      case "score":
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Indicateur</th>
                  <th className="px-4 py-3 text-left">Valeur</th>
                  <th className="px-4 py-3 text-left">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {scoreBreakdown.map((row) => (
                  <tr key={row.metric} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.metric}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.value}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  }, [
    activeTab,
    documentsCount,
    formatDate,
    formatStatus,
    likedTerms,
    likedTermsLoading,
    modificationsLoading,
    researcherModifications,
    scoreBreakdown,
    userReports,
    reportsLoading,
    statsData,
    handleDeleteModification,
    handleEditModification,
  ]);

  const EditModificationDialog = () => {
    if (!isEditModificationDialogOpen || !editingModification) return null;

    const isPending =
      (editingModification.status || "").toLowerCase() === "pending";

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Modifier la proposition
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {editingModification.termTitle ||
                  editingModification.term_title ||
                  "Terme"}{" "}
                &mdash; statut actuel :{" "}
                <span className="font-medium text-foreground">
                  {formatStatus(editingModification.status)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={resetModificationState}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!isPending && (
            <div className="px-6 py-3 bg-amber-500/10 text-amber-700 text-xs">
              Cette proposition n'est plus en attente et ne peut plus etre
              modifiee. Vous pouvez soumettre une nouvelle proposition si
              necessaire.
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {modificationFormLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Chargement de la proposition...
              </div>
            ) : modificationFormData ? (
              <div className="space-y-6 pr-1">
                <SubmitFormSection
                  formData={modificationFormData}
                  setFormData={setModificationFormData}
                />
              </div>
            ) : (
              <div className="py-20 text-center text-muted-foreground">
                Impossible de charger la proposition.
              </div>
            )}
          </div>

          <div className="border-t border-border/60 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetModificationState}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveModification}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={
                !isPending ||
                modificationFormLoading ||
                modificationSaving ||
                !modificationFormData
              }
            >
              {modificationSaving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Enregistrer
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Edit Report Dialog Component
  const EditReportDialog = () => {
    const [reason, setReason] = useState(editingReport?.reason || "");

    useEffect(() => {
      if (editingReport) {
        setReason(editingReport.reason || "");
      }
    }, [editingReport]);

    if (!isEditDialogOpen || !editingReport) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background rounded-lg shadow-xl max-w-md w-full p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">
              Modifier le signalement
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingReport(null);
              }}
              className="p-1 rounded hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Terme:{" "}
              <span className="font-medium text-foreground">
                {editingReport.term_title || editingReport.termTitle}
              </span>
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Raison du signalement
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              placeholder="Décrivez la raison du signalement..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingReport(null);
              }}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => handleSaveReport({ reason })}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <>
      <EditReportDialog />
      <EditModificationDialog />
      <Helmet>
        <title>Tableau de bord - Dictionnaire Collaboratif</title>
        <meta
          name="description"
          content="Votre tableau de bord personnel pour gérer vos contributions."
        />
      </Helmet>
      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">
                  Bonjour,{" "}
                  <span className="creative-gradient-text">
                    {isResearcher ? fullName : user.name}
                  </span>{" "}
                  !
                </h1>
                <p className="text-muted-foreground text-lg">
                  {isResearcher
                    ? "Bienvenue sur votre espace de recherche collaboratif."
                    : isAuthor
                    ? "Bienvenue sur votre espace de création et contribution."
                    : "Bienvenue sur votre tableau de bord personnel."}
                </p>
              </div>
              {(isAuthor || user?.role === "admin") && (
                <Link to="/submit">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-5 w-5" />
                    Contribuer un terme
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>

          {statsLoading ? (
            <div className="flex items-center justify-center gap-3 mb-8 p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">
                Chargement de vos statistiques...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat) => (
                <StatCard
                  key={stat.title}
                  {...stat}
                  onClick={
                    isResearcher && stat.tabKey
                      ? () => setActiveTab(stat.tabKey)
                      : undefined
                  }
                  active={isResearcher && stat.tabKey === activeTab}
                />
              ))}
            </div>
          )}

          {(isResearcher || user?.role === "admin") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10"
            >
              <div className="rounded-3xl border border-border/60 bg-background/70 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="flex flex-wrap gap-2 p-6 pb-4">
                  {researcherTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeTab === tab.key
                          ? "bg-primary text-white shadow"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="px-6 pb-6">{renderTabContent()}</div>
              </div>
            </motion.div>
          )}

          {!isResearcher && likedTerms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10"
            >
              <div className="rounded-3xl border border-border/60 bg-background/70 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Heart className="h-6 w-6 text-pink-500" />
                    Termes que vous avez aimés ({likedTerms.length})
                  </h2>
                  {likedTermsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                          <tr>
                            <th className="px-4 py-3 text-left">Terme</th>
                            <th className="px-4 py-3 text-left">Statut</th>
                            <th className="px-4 py-3 text-left">Aimé le</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {likedTerms.map((term) => (
                            <tr key={term.id} className="hover:bg-muted/40">
                              <td className="px-4 py-3 font-medium text-foreground">
                                <div>
                                  <div className="text-primary font-semibold">
                                    {term.term || "Terme sans titre"}
                                  </div>
                                  {term.definition && (
                                    <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                      {term.definition.substring(0, 100)}...
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {formatStatus(term.status)}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {formatDate(term.likedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <UserTermsList userTerms={userTerms} loading={loading} user={user} />
        </div>
      </div>
    </>
  );
};

export default Dashboard;

const normalizeCollectionForForm = (collection) => {
  const arrayValue = Array.isArray(collection)
    ? collection
    : collection
    ? [collection]
    : [];

  const normalized = arrayValue
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const text = item.trim();
        return text ? { text } : null;
      }
      if (typeof item === "object") {
        const textCandidate =
          (typeof item.text === "string" && item.text.trim()) ||
          (typeof item.value === "string" && item.value.trim()) ||
          (typeof item.label === "string" && item.label.trim()) ||
          (typeof item.term === "string" && item.term.trim()) ||
          (typeof item.url === "string" && item.url.trim()) ||
          "";
        return { text: textCandidate };
      }
      return null;
    })
    .filter(Boolean);

  if (normalized.length === 0) {
    return [{ text: "" }];
  }

  return normalized.map((entry) => ({
    text: entry.text ?? "",
  }));
};

const sanitizeCollectionForDiff = (collection) => {
  const arrayValue = Array.isArray(collection)
    ? collection
    : collection
    ? [collection]
    : [];

  return arrayValue
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const text = item.trim();
        return text ? { text } : null;
      }
      if (typeof item === "object") {
        const textCandidate =
          (typeof item.text === "string" && item.text.trim()) ||
          (typeof item.value === "string" && item.value.trim()) ||
          (typeof item.label === "string" && item.label.trim()) ||
          (typeof item.term === "string" && item.term.trim()) ||
          (typeof item.url === "string" && item.url.trim()) ||
          "";
        return textCandidate ? { text: textCandidate } : null;
      }
      return null;
    })
    .filter(Boolean);
};

const cloneFormData = (form) => {
  if (!form) return null;
  return {
    ...form,
    exemples: (form.exemples || []).map((item) => ({ ...item })),
    sources: (form.sources || []).map((item) => ({ ...item })),
    remarques: (form.remarques || []).map((item) => ({ ...item })),
  };
};

const buildTermBaseline = (termData, commentValue = "") => {
  if (!termData) return null;
  return {
    term: termData.term || termData.terme || "",
    definition:
      termData.definition ||
      termData.definition_fr ||
      termData.description ||
      "",
    categorie_id:
      termData.categorie_id ??
      termData.category_id ??
      termData.categoryId ??
      null,
    category: termData.category || termData.categorie || "",
    exemples: normalizeCollectionForForm(
      termData.exemples || termData.examples || []
    ),
    sources: normalizeCollectionForForm(termData.sources || []),
    remarques: normalizeCollectionForForm(
      termData.remarques || termData.remarks || []
    ),
    moderatorComment: commentValue || "",
  };
};

const applyChangesToFormData = (baselineForm, rawChanges) => {
  if (!baselineForm) return null;
  const updated = cloneFormData(baselineForm);
  const sanitized = sanitizeModificationChanges(rawChanges || {});

  const termChange =
    sanitized.term ?? sanitized.terme ?? sanitized.term_title ?? null;
  if (termChange !== null && termChange !== undefined) {
    updated.term = String(termChange);
  }

  const definitionChange =
    sanitized.definition ?? sanitized.definition_fr ?? null;
  if (definitionChange !== null && definitionChange !== undefined) {
    updated.definition = String(definitionChange);
  }

  const categoryChange =
    sanitized.categorie_id ?? sanitized.category_id ?? null;
  if (categoryChange !== null && categoryChange !== undefined) {
    const parsedCategory = Number(categoryChange);
    updated.categorie_id = Number.isNaN(parsedCategory) ? null : parsedCategory;
  }

  const examplesChange = sanitized.exemples ?? sanitized.examples ?? null;
  if (examplesChange !== null && examplesChange !== undefined) {
    updated.exemples = normalizeCollectionForForm(examplesChange);
  }

  const sourcesChange = sanitized.sources ?? null;
  if (sourcesChange !== null && sourcesChange !== undefined) {
    updated.sources = normalizeCollectionForForm(sourcesChange);
  }

  const remarksChange = sanitized.remarques ?? sanitized.remarks ?? null;
  if (remarksChange !== null && remarksChange !== undefined) {
    updated.remarques = normalizeCollectionForForm(remarksChange);
  }

  return updated;
};

const computeChangesDiff = (baseline, current) => {
  if (!baseline || !current) return {};

  const diff = {};
  const trimValue = (value) =>
    value === null || value === undefined ? "" : String(value).trim();

  if (trimValue(baseline.term) !== trimValue(current.term)) {
    diff.term = trimValue(current.term);
  }

  if (trimValue(baseline.definition) !== trimValue(current.definition)) {
    diff.definition = trimValue(current.definition);
  }

  const baseCategory =
    baseline.categorie_id === null || baseline.categorie_id === undefined
      ? null
      : Number(baseline.categorie_id);
  const currentCategory =
    current.categorie_id === null || current.categorie_id === undefined
      ? null
      : Number(current.categorie_id);
  if (Number.isNaN(currentCategory)) {
    diff.categorie_id = null;
  } else if (baseCategory !== currentCategory) {
    diff.categorie_id = currentCategory;
  }

  const baseExamples = sanitizeCollectionForDiff(baseline.exemples);
  const currentExamples = sanitizeCollectionForDiff(current.exemples);
  if (JSON.stringify(baseExamples) !== JSON.stringify(currentExamples)) {
    diff.exemples = currentExamples;
  }

  const baseSources = sanitizeCollectionForDiff(baseline.sources);
  const currentSources = sanitizeCollectionForDiff(current.sources);
  if (JSON.stringify(baseSources) !== JSON.stringify(currentSources)) {
    diff.sources = currentSources;
  }

  const baseRemarks = sanitizeCollectionForDiff(baseline.remarques);
  const currentRemarks = sanitizeCollectionForDiff(current.remarques);
  if (JSON.stringify(baseRemarks) !== JSON.stringify(currentRemarks)) {
    diff.remarques = currentRemarks;
  }

  return diff;
};

const normalizeChangesForComparison = (rawChanges) => {
  const sanitized = sanitizeModificationChanges(rawChanges || {});
  const normalized = {};

  const termValue =
    sanitized.term ?? sanitized.terme ?? sanitized.term_title ?? null;
  if (termValue !== null && termValue !== undefined) {
    normalized.term = String(termValue).trim();
  }

  const definitionValue =
    sanitized.definition ?? sanitized.definition_fr ?? null;
  if (definitionValue !== null && definitionValue !== undefined) {
    normalized.definition = String(definitionValue).trim();
  }

  const categoryValue =
    sanitized.categorie_id ??
    sanitized.category_id ??
    sanitized.categoryId ??
    null;
  if (categoryValue !== null && categoryValue !== undefined) {
    const parsedCategory = Number(categoryValue);
    if (!Number.isNaN(parsedCategory)) {
      normalized.categorie_id = parsedCategory;
    }
  }

  const examplesValue = sanitized.exemples ?? sanitized.examples ?? null;
  if (examplesValue !== null && examplesValue !== undefined) {
    const normalizedExamples = sanitizeCollectionForDiff(examplesValue);
    if (normalizedExamples.length) {
      normalized.exemples = normalizedExamples;
    }
  }

  const sourcesValue = sanitized.sources ?? null;
  if (sourcesValue !== null && sourcesValue !== undefined) {
    const normalizedSources = sanitizeCollectionForDiff(sourcesValue);
    if (normalizedSources.length) {
      normalized.sources = normalizedSources;
    }
  }

  const remarksValue = sanitized.remarques ?? sanitized.remarks ?? null;
  if (remarksValue !== null && remarksValue !== undefined) {
    const normalizedRemarks = sanitizeCollectionForDiff(remarksValue);
    if (normalizedRemarks.length) {
      normalized.remarques = normalizedRemarks;
    }
  }

  return normalized;
};

// duplicate removed; the resetModificationState hook is defined inside the component
