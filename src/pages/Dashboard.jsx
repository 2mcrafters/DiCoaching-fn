import React, { useMemo, useEffect, useState, useCallback } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Helmet } from "react-helmet-async";
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
  MessageSquare,
  User,
  Mail,
  Phone,
  Calendar,
  Info,
  Shield,
  Copy,
  ExternalLink,
  ArrowRight,
  Check,
  Activity,
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
import apiService from "@/services/api";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/Pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Dashboard = () => {
  const { user, hasAuthorPermissions } = useAuth();
  const { confirmDelete, ConfirmDialog } = useConfirmDialog();
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
      try {
        dispatch(fetchUserStats(user.id));
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
      }
    }

    // Fetch terms for the list display if needed
    if (!allTerms || allTerms.length === 0) {
      dispatch(fetchTerms({ limit: 10000 }));
    }
  }, [dispatch, user?.id, allTerms?.length]);

  const roleLc = (user?.role || "").toString().trim().toLowerCase();
  const isResearcher = roleLc === "researcher";
  // Treat user as author if:
  // - hasAuthorPermissions() returns true
  // - role is 'author' or French 'auteur' (case-insensitive)
  // User is considered author for UI only if they actually have permissions (approved) or admin
  const isAuthor =
    (typeof hasAuthorPermissions === "function" && hasAuthorPermissions()) ||
    user?.role === "admin";

  // Detect pending-like author state (registered as author but waiting for approval)
  const statusLc = (user?.status || user?.state || "").toString().toLowerCase();
  const isAuthorRole = roleLc === "author";
  const isPendingLike = [
    "pending",
    "requested",
    "en_attente",
    "to_validate",
  ].includes(statusLc);
  const needsAuthorApproval = isAuthorRole && isPendingLike;

  // Rejection detection: user was downgraded to researcher and status indicates rejection/suspension
  const isRejectedLike =
    roleLc === "researcher" && ["rejected", "suspended"].includes(statusLc);

  // One-time rejection modal per session and user
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  useEffect(() => {
    const key = `rejectionNotice:${user?.id || "0"}`;
    if (isRejectedLike) {
      const already = sessionStorage.getItem(key);
      if (!already) {
        setRejectionModalOpen(true);
        sessionStorage.setItem(key, "1");
      }
    } else {
      setRejectionModalOpen(false);
    }
  }, [isRejectedLike, user?.id]);

  // Local state to control the informational modal for pending authors
  const [pendingModalOpen, setPendingModalOpen] = useState(needsAuthorApproval);
  useEffect(() => {
    setPendingModalOpen(needsAuthorApproval);
  }, [needsAuthorApproval]);

  useEffect(() => {
    if (isResearcher && user?.id) {
      dispatch(fetchModifications());
    }
  }, [dispatch, isResearcher, user?.id]);

  // Separate active tab states for each section
  const [activeContentTab, setActiveContentTab] = useState(
    isAuthor || user?.role === "admin" ? "terms" : null
  );
  const [activeActivityTab, setActiveActivityTab] = useState(
    isAuthor || user?.role === "admin" ? "pending-validation" : null
  );
  const [activeTab, setActiveTab] = useState(isResearcher ? "liked" : null);

  useEffect(() => {
    if (isResearcher) {
      setActiveTab((prev) => prev || "liked");
    } else if (isAuthor || user?.role === "admin") {
      setActiveContentTab((prev) => prev || "terms");
      setActiveActivityTab((prev) => prev || "pending-validation");
    } else {
      setActiveTab(null);
      setActiveContentTab(null);
      setActiveActivityTab(null);
    }
  }, [isResearcher, isAuthor, user?.role]);

  const userTerms = useMemo(() => {
    return (allTerms || []).filter(
      (t) => String(t.authorId) === String(user.id)
    );
  }, [allTerms, user?.id]);

  // Calculate new user terms (created in last 24 hours)
  useEffect(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newTerms = userTerms.filter((term) => {
      const createdDate = new Date(term.created_at || term.createdAt);
      return createdDate > oneDayAgo;
    });
    setNewUserTermsCount(newTerms.length);
  }, [userTerms]);

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
  const [receivedLikes, setReceivedLikes] = useState([]);
  const [receivedLikesLoading, setReceivedLikesLoading] = useState(false);
  const [userReports, setUserReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [receivedReports, setReceivedReports] = useState([]);
  const [receivedReportsLoading, setReceivedReportsLoading] = useState(false);
  const [reportDetails, setReportDetails] = useState(null);
  const [updatingReportStatus, setUpdatingReportStatus] = useState(false);
  const [userComments, setUserComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  // My own comments (authored by me)
  const [myComments, setMyComments] = useState([]);
  const [myCommentsLoading, setMyCommentsLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySubmitting, setReplySubmitting] = useState({});
  const [newCommentsCount, setNewCommentsCount] = useState(0);

  // Pending validation modifications for authors
  const [pendingValidationMods, setPendingValidationMods] = useState([]);
  const [pendingValidationLoading, setPendingValidationLoading] =
    useState(false);
  const [newPendingValidationCount, setNewPendingValidationCount] = useState(0);

  // New item counts for notifications (items within 24 hours)
  const [newReceivedReportsCount, setNewReceivedReportsCount] = useState(0);
  const [newLikedTermsCount, setNewLikedTermsCount] = useState(0);
  const [newUserTermsCount, setNewUserTermsCount] = useState(0);
  const [newUserReportsCount, setNewUserReportsCount] = useState(0);
  const [newModificationsCount, setNewModificationsCount] = useState(0);

  // Track which tabs have been viewed (to hide notifications)
  const [viewedTabs, setViewedTabs] = useState(new Set());

  // Persist read/unread state per tab and per user using localStorage
  // lastSeenCounts maps tabKey -> last seen badge count for that tab
  const [lastSeenCounts, setLastSeenCounts] = useState({});

  // Compute current badge counts by tab key for all sections
  const currentBadgesByTab = useMemo(
    () => ({
      // Researcher tabs
      liked: newLikedTermsCount || 0,
      modifications: newModificationsCount || 0,
      reports: newUserReportsCount || 0,
      activities: 0,
      // Author - My Content
      terms: newUserTermsCount || 0,
      "comments-received": newCommentsCount || 0,
      "reports-received": newReceivedReportsCount || 0,
      "likes-received": 0,
      // Author - My Activities
      "pending-validation": newPendingValidationCount || 0,
      "my-likes": newLikedTermsCount || 0,
      "my-comments": 0,
      // Aliases
      comments: newCommentsCount || 0,
    }),
    [
      newLikedTermsCount,
      newModificationsCount,
      newUserReportsCount,
      newUserTermsCount,
      newCommentsCount,
      newReceivedReportsCount,
      newPendingValidationCount,
    ]
  );

  // Load last seen counts from localStorage when user changes
  useEffect(() => {
    if (!user?.id) return;
    try {
      const key = `dashboard:lastSeen:${user.id}`;
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      setLastSeenCounts(parsed && typeof parsed === "object" ? parsed : {});
    } catch {
      setLastSeenCounts({});
    }
  }, [user?.id]);

  // Ensure lastSeenCounts do not exceed current counts (clamp down if needed)
  useEffect(() => {
    if (!user?.id) return;
    let changed = false;
    const updated = { ...lastSeenCounts };
    Object.entries(currentBadgesByTab).forEach(([key, current]) => {
      const curr = Number(current || 0);
      const seen = Number(updated[key] || 0);
      if (seen > curr) {
        updated[key] = curr;
        changed = true;
      }
    });
    if (changed) {
      setLastSeenCounts(updated);
      try {
        localStorage.setItem(
          `dashboard:lastSeen:${user.id}`,
          JSON.stringify(updated)
        );
      } catch {}
    }
  }, [currentBadgesByTab, user?.id, lastSeenCounts]);

  // Filters: content section (Mes termes, Commentaires reçus, Likes reçus)
  const [contentFilters, setContentFilters] = useState({
    q: "",
    from: "",
    to: "",
  });
  // Filters: activity section (Modifications à valider, Mes likes, Mes commentaires)
  const [activityFilters, setActivityFilters] = useState({
    q: "",
    from: "",
    to: "",
  });

  const renderFilters = useCallback(
    (filters, setFilters) => (
      <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">
            Recherche
          </label>
          <Input
            value={filters.q}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, q: e.target.value }))
            }
            placeholder="Mot-clé (terme, auteur, contenu...)"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Du</label>
          <Input
            type="date"
            value={filters.from}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, from: e.target.value }))
            }
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">
              Au
            </label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, to: e.target.value }))
              }
            />
          </div>
          <Button
            variant="outline"
            className="h-10 mt-5"
            onClick={() => setFilters({ q: "", from: "", to: "" })}
          >
            Réinitialiser
          </Button>
        </div>
      </div>
    ),
    []
  );

  const inRange = useCallback((dateStr, from, to) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return true;
    if (from) {
      const f = new Date(from + "T00:00:00");
      if (d < f) return false;
    }
    if (to) {
      const t = new Date(to + "T23:59:59");
      if (d > t) return false;
    }
    return true;
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    // Content section pages
    setCommentsPage(1);
    setUserTermsPage(1);
    setReceivedLikesPage(1);
  }, [contentFilters]);

  useEffect(() => {
    // Activity section pages
    setPendingValidationPage(1);
    setLikedTermsPage(1);
    setMyCommentsPage(1);
  }, [activityFilters]);

  // Handler to clear notification when tab is clicked
  const handleTabClick = useCallback(
    (tabKey, section = null) => {
      // Update the appropriate active tab state based on section
      if (section === "content") {
        setActiveContentTab(tabKey);
      } else if (section === "activity") {
        setActiveActivityTab(tabKey);
      } else {
        setActiveTab(tabKey);
      }

      // Mark tab as viewed
      setViewedTabs((prev) => new Set([...prev, tabKey]));

      // Persist last seen badge count for this tab (per user)
      const current = Number(currentBadgesByTab[tabKey] || 0);
      setLastSeenCounts((prev) => {
        const next = { ...prev, [tabKey]: current };
        try {
          if (user?.id) {
            localStorage.setItem(
              `dashboard:lastSeen:${user.id}`,
              JSON.stringify(next)
            );
          }
        } catch {}
        return next;
      });

      // Clear the notification for this tab
      switch (tabKey) {
        case "comments":
        case "comments-received":
          setNewCommentsCount(0);
          break;
        case "liked":
        case "my-likes":
        case "termes-apprecies":
          setNewLikedTermsCount(0);
          break;
        case "terms":
          setNewUserTermsCount(0);
          break;
        case "reports-received":
          setNewReceivedReportsCount(0);
          break;
        case "reports":
          setNewUserReportsCount(0);
          break;
        case "modifications":
          setNewModificationsCount(0);
          break;
        case "pending-validation":
          setNewPendingValidationCount(0);
          break;
        default:
          break;
      }
    },
    [currentBadgesByTab, user?.id]
  );

  // Pagination state for each tab (5 items per page)
  const [commentsPage, setCommentsPage] = useState(1);
  const [myCommentsPage, setMyCommentsPage] = useState(1);
  const [likedTermsPage, setLikedTermsPage] = useState(1);
  const [userTermsPage, setUserTermsPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const [pendingValidationPage, setPendingValidationPage] = useState(1);
  const [receivedLikesPage, setReceivedLikesPage] = useState(1);
  const itemsPerPage = 5;

  const [editingReport, setEditingReport] = useState(null);

  // View Changes dialog state (for pending validation modifications)
  const [viewChangesOpen, setViewChangesOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewTitle, setViewTitle] = useState("");
  const [viewBefore, setViewBefore] = useState(null);
  const [viewAfter, setViewAfter] = useState(null);
  const [viewChangedKeys, setViewChangedKeys] = useState([]);

  const formatCollectionDisplay = useCallback((items) => {
    if (!Array.isArray(items)) return "—";
    if (items.length === 0) return "—";
    return items
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item;
        if (item.text) return String(item.text);
        if (item.label) return String(item.label);
        if (item.term) return String(item.term);
        if (item.url) return String(item.url);
        return JSON.stringify(item);
      })
      .filter(Boolean)
      .join("\n• ");
  }, []);

  const formatFieldValue = useCallback(
    (key, value) => {
      if (value === null || value === undefined) return "—";
      switch (key) {
        case "exemples":
        case "sources":
        case "remarques":
          return formatCollectionDisplay(value);
        case "categorie_id":
        case "category_id":
          return String(value);
        default:
          return String(value);
      }
    },
    [formatCollectionDisplay]
  );

  const findTermInStore = useCallback(
    (id, slug) => {
      if (!allTerms || allTerms.length === 0) return null;
      const byId = allTerms.find((t) => String(t.id) === String(id));
      if (byId) return byId;
      if (slug) {
        const bySlug = allTerms.find((t) => String(t.slug) === String(slug));
        if (bySlug) return bySlug;
      }
      return null;
    },
    [allTerms]
  );

  const handleViewChanges = useCallback(
    async (modification) => {
      try {
        setViewLoading(true);
        setViewTitle(modification.term_title || "Terme");

        // 1) Get current term data from store or API
        let termData = findTermInStore(
          modification.term_id,
          modification.term_slug
        );
        if (!termData && modification.term_id) {
          try {
            const res = await apiService.getTerm(modification.term_id);
            termData = res?.data || res || null;
          } catch (e) {
            console.warn("Could not fetch term by id:", e);
          }
        }

        // 2) Build baseline and proposed data using existing helpers
        const baseline = buildTermBaseline(
          termData || { terme: modification.term_title }
        );
        const proposed = applyChangesToFormData(
          baseline,
          modification.changes || {}
        );

        // 3) Compute changed keys to display
        const diff = computeChangesDiff(baseline, proposed);
        const changedKeys = Object.keys(diff);

        setViewBefore(baseline);
        setViewAfter(proposed);
        setViewChangedKeys(changedKeys);
        setViewChangesOpen(true);
      } catch (error) {
        console.error("Error preparing view changes:", error);
        toast({
          title: "Impossible d'afficher les changements",
          description: "Une erreur est survenue pendant le chargement.",
          variant: "destructive",
        });
      } finally {
        setViewLoading(false);
      }
    },
    [findTermInStore, toast]
  );
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
            const response = await apiService.getTerm(
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
      const confirmed = await confirmDelete({
        title: "Supprimer cette modification ?",
        description:
          "Cette proposition de modification sera définitivement supprimée. Cette action est irréversible.",
        confirmText: "Supprimer",
        cancelText: "Annuler",
      });

      if (!confirmed) {
        return;
      }

      try {
        await apiService.deleteModification(modificationId);
        dispatch(fetchModifications());
        console.log("[Dashboard] Modification deleted");
        toast({
          title: "Modification supprimée",
          description:
            "La proposition de modification a été supprimée avec succès.",
        });
      } catch (error) {
        console.error("Error deleting modification:", error);
        toast({
          title: "Erreur",
          description:
            "Erreur lors de la suppression de la modification. Veuillez réessayer.",
          variant: "destructive",
        });
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
    const abortController = new AbortController();

    const fetchLikedTerms = async () => {
      if (!user?.id) return;

      setLikedTermsLoading(true);
      try {
        const apiService = await import("@/services/api");
        const data = await apiService.default.getUserLikedTerms();

        if (!abortController.signal.aborted) {
          console.log("❤️ Liked Terms Received:", data);
          const likedTermsData = Array.isArray(data) ? data : [];
          setLikedTerms(likedTermsData);

          // Calculate new liked terms (last 24 hours)
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const newLiked = likedTermsData.filter((term) => {
            const likedDate = new Date(term.likedAt || term.liked_at);
            return likedDate > oneDayAgo;
          });
          setNewLikedTermsCount(newLiked.length);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("❌ Error fetching liked terms:", error);
          setLikedTerms([]);
          setNewLikedTermsCount(0);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLikedTermsLoading(false);
        }
      }
    };

    fetchLikedTerms();

    return () => {
      try {
        if (abortController.signal && !abortController.signal.aborted) {
          abortController.abort();
        }
      } catch (err) {
        // Silently ignore abort errors
      }
    };
  }, [user?.id]);

  // Fetch received likes (for authors and admins)
  useEffect(() => {
    const abortController = new AbortController();

    const fetchReceivedLikes = async () => {
      if (!user?.id || (!isAuthor && user?.role !== "admin")) return;

      setReceivedLikesLoading(true);
      try {
        const apiService = await import("@/services/api");
        const data = await apiService.default.getReceivedLikes();

        if (!abortController.signal.aborted) {
          console.log("💝 Received Likes Data:", data);
          const receivedLikesData = Array.isArray(data) ? data : [];
          setReceivedLikes(receivedLikesData);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          // Graceful fallback: just clear the list and continue rendering
          console.warn("Received likes unavailable:", error?.message || error);
          setReceivedLikes([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setReceivedLikesLoading(false);
        }
      }
    };

    fetchReceivedLikes();

    return () => {
      try {
        if (abortController.signal && !abortController.signal.aborted) {
          abortController.abort();
        }
      } catch (err) {
        // Silently ignore abort errors
      }
    };
  }, [user?.id, isAuthor]);

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

        // Calculate new user reports (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newReports = myReports.filter((report) => {
          const reportDate = new Date(report.created_at || report.createdAt);
          return reportDate > oneDayAgo;
        });
        setNewUserReportsCount(newReports.length);
      } catch (error) {
        console.error("❌ Error fetching user reports:", error);
        setUserReports([]);
        setNewUserReportsCount(0);
      } finally {
        setReportsLoading(false);
      }
    };

    fetchUserReports();
  }, [user?.id, isResearcher, user?.role]);

  // Fetch comments on author's terms (for authors and admins)
  useEffect(() => {
    const fetchUserComments = async () => {
      if (!user?.id) return;

      // Only fetch for authors and admins
      const shouldFetch = isAuthor || user?.role === "admin";
      if (!shouldFetch) return;

      setCommentsLoading(true);
      try {
        const data = await apiService.getAuthorComments(user.id);
        console.log("💬 Comments on Author Terms:", data);

        const comments = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setUserComments(comments);

        // Calculate new comments (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newComments = comments.filter((comment) => {
          const commentDate = new Date(comment.createdAt);
          return commentDate > oneDayAgo;
        });
        setNewCommentsCount(newComments.length);
      } catch (error) {
        console.error("❌ Error fetching comments:", error);
        setUserComments([]);
        setNewCommentsCount(0);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchUserComments();
  }, [user?.id, isAuthor, user?.role]);

  // Fetch my own comments (authored by me)
  useEffect(() => {
    const fetchMyComments = async () => {
      if (!user?.id) return;
      setMyCommentsLoading(true);
      try {
        const api = await import("@/services/api");
        const data = await api.default.getMyComments();
        const comments = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setMyComments(comments);
      } catch (error) {
        console.error("❌ Error fetching my comments:", error);
        setMyComments([]);
      } finally {
        setMyCommentsLoading(false);
      }
    };
    fetchMyComments();
  }, [user?.id]);

  // Also (re)fetch when the user opens the "Mes commentaires" tab to ensure fresh data
  useEffect(() => {
    const loadOnTabOpen = async () => {
      if (activeActivityTab !== "my-comments") return;
      try {
        setMyCommentsLoading(true);
        const data = await apiService.getMyComments();
        const comments = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setMyComments(comments);
      } catch (e) {
        console.warn("Failed to refresh my-comments on tab open:", e);
      } finally {
        setMyCommentsLoading(false);
      }
    };
    loadOnTabOpen();
  }, [activeActivityTab]);

  // Fetch reports received on user's own terms (authors/admin)
  useEffect(() => {
    const fetchReceivedReports = async () => {
      if (!user?.id) return;
      const shouldFetch = isAuthor || user?.role === "admin";
      if (!shouldFetch) return;
      setReceivedReportsLoading(true);
      try {
        const data = await apiService.getAuthorReports(user.id);
        console.log("🚩 Reports Received On My Terms:", data);
        const reports = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setReceivedReports(reports);

        // Calculate new reports (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newReports = reports.filter((report) => {
          const reportDate = new Date(report.created_at || report.createdAt);
          return reportDate > oneDayAgo;
        });
        setNewReceivedReportsCount(newReports.length);
      } catch (error) {
        console.error("❌ Error fetching reports on author terms:", error);
        setReceivedReports([]);
        setNewReceivedReportsCount(0);
      } finally {
        setReceivedReportsLoading(false);
      }
    };
    fetchReceivedReports();
  }, [user?.id, isAuthor, user?.role]);

  // Fetch pending validation modifications for authors (modifications on their terms that they need to validate)
  useEffect(() => {
    if (!isAuthor && user?.role !== "admin") return;

    const fetchPendingValidation = async () => {
      setPendingValidationLoading(true);
      try {
        const apiService = await import("@/services/api");
        const data = await apiService.default.getPendingValidationModifications(
          { scope: "mine" }
        );
        console.log("✅ Pending Validation Mods:", data);

        const modifications = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setPendingValidationMods(modifications);

        // Calculate new pending validations (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newMods = modifications.filter((mod) => {
          const modDate = new Date(mod.created_at || mod.createdAt);
          return modDate > oneDayAgo;
        });
        setNewPendingValidationCount(newMods.length);
      } catch (error) {
        console.error(
          "❌ Error fetching pending validation modifications:",
          error
        );
        setPendingValidationMods([]);
        setNewPendingValidationCount(0);
      } finally {
        setPendingValidationLoading(false);
      }
    };
    fetchPendingValidation();
  }, [user?.id, isAuthor, user?.role]);

  // Handler for editing a report
  const handleEditReport = useCallback((report) => {
    setEditingReport(report);
    setIsEditDialogOpen(true);
  }, []);

  // Handler for deleting a report
  const handleDeleteReport = useCallback(
    async (reportId) => {
      const confirmed = await confirmDelete({
        title: "Supprimer ce signalement ?",
        description:
          "Ce signalement sera définitivement supprimé. Cette action est irréversible.",
        confirmText: "Supprimer",
        cancelText: "Annuler",
      });

      if (!confirmed) {
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

  // Handler for validating or rejecting modifications (author validation)
  const handleModificationValidation = useCallback(
    async (modificationId, action) => {
      const isApprove = action === "approve";
      const confirmed = await confirmDelete({
        title: isApprove
          ? "Approuver cette modification ?"
          : "Rejeter cette modification ?",
        description: isApprove
          ? "Cette modification sera appliquée au terme."
          : "Cette modification sera rejetée et ne sera pas appliquée.",
        confirmText: isApprove ? "Approuver" : "Rejeter",
        cancelText: "Annuler",
      });

      if (!confirmed) {
        return;
      }

      try {
        await apiService.validateModification(
          modificationId,
          isApprove ? "approved" : "rejected"
        );

        // Remove from pending validation list
        setPendingValidationMods((prev) =>
          prev.filter((mod) => mod.id !== modificationId)
        );

        // Refresh stats
        if (user?.id) {
          dispatch(fetchUserStats(user.id));
        }

        toast({
          title: isApprove ? "Modification approuvée" : "Modification rejetée",
          description: isApprove
            ? "La modification a été appliquée avec succès."
            : "La modification a été rejetée.",
        });

        console.log(
          `✅ Modification ${isApprove ? "approved" : "rejected"} successfully`
        );
      } catch (error) {
        console.error("❌ Error validating modification:", error);
        toast({
          title: "Erreur",
          description:
            "Erreur lors de la validation de la modification. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    },
    [user?.id, dispatch, confirmDelete, toast]
  );

  // (Legacy) handler kept for compatibility, delegates to new system
  const handleResolveOrIgnoreReport = useCallback(async (reportId, action) => {
    const statusMap = { resolved: "resolved", ignored: "ignored" };
    const targetStatus = statusMap[action] || "pending";
    try {
      const apiService = await import("@/services/api");
      await apiService.default.updateReport(reportId, { status: targetStatus });
      setReceivedReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: targetStatus } : r
        )
      );
    } catch (e) {
      console.error("❌ Error updating report status (legacy):", e);
    }
  }, []);

  const handleUpdateReportStatus = useCallback(async (reportId, newStatus) => {
    if (!reportId || !newStatus) return;
    setUpdatingReportStatus(true);
    try {
      const apiService = await import("@/services/api");
      await apiService.default.updateReport(reportId, { status: newStatus });
      setReceivedReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      setReportDetails((r) =>
        r && r.id === reportId ? { ...r, status: newStatus } : r
      );
    } catch (e) {
      console.error("❌ Error updating report status:", e);
      alert("Erreur lors de la mise à jour du statut.");
    } finally {
      setUpdatingReportStatus(false);
    }
  }, []);

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
          title: "Mes Termes",
          value: statsData.total || userTerms.length,
          icon: FileText,
          color: "from-green-500 to-green-400",
          delay: 0.1,
          description: `${statsData.published || 0} publiés sur ${
            statsData.total || userTerms.length
          }`,
          tabKey: "terms",
        },
        {
          title: "Commentaires Reçus",
          value: userComments.length,
          icon: MessageSquare,
          color: "from-blue-500 to-blue-400",
          delay: 0.2,
          description:
            newCommentsCount > 0
              ? `${newCommentsCount} nouveau${newCommentsCount > 1 ? "x" : ""}`
              : "Sur vos termes",
          tabKey: "comments",
          badge: newCommentsCount > 0 ? newCommentsCount : null,
        },
        {
          title: "À Valider",
          value: pendingValidationMods.length,
          icon: CheckCircle,
          color: "from-orange-500 to-orange-400",
          delay: 0.3,
          description:
            newPendingValidationCount > 0
              ? `${newPendingValidationCount} nouvelle${
                  newPendingValidationCount > 1 ? "s" : ""
                }`
              : "Modifications à valider",
          tabKey: "pending-validation",
          badge:
            newPendingValidationCount > 0 ? newPendingValidationCount : null,
        },
        {
          title: "Termes Aimés",
          value: likedTerms.length,
          icon: Heart,
          color: "from-pink-500 to-pink-400",
          delay: 0.4,
          description:
            newLikedTermsCount > 0
              ? `${newLikedTermsCount} nouveau${
                  newLikedTermsCount > 1 ? "x" : ""
                }`
              : "Que vous avez aimés",
          tabKey: "liked",
          badge: newLikedTermsCount > 0 ? newLikedTermsCount : null,
        },
        {
          title: "Signalements Reçus",
          value: receivedReports.length,
          icon: AlertTriangle,
          color: "from-red-500 to-red-400",
          delay: 0.5,
          description:
            newReceivedReportsCount > 0
              ? `${newReceivedReportsCount} nouveau${
                  newReceivedReportsCount > 1 ? "x" : ""
                }`
              : "Sur vos termes",
          tabKey: "reports-received",
          badge: newReceivedReportsCount > 0 ? newReceivedReportsCount : null,
        },
        {
          title: "Likes Reçus",
          value: statsData.likes || 0,
          icon: Star,
          color: "from-yellow-500 to-yellow-400",
          delay: 0.6,
          description: "Sur vos termes",
          tabKey: "liked",
        },
      ];

  const researcherModifications = useMemo(() => {
    if (!isResearcher || !user?.id) return [];
    return (allModifications || []).filter(
      (mod) => String(mod.proposerId) === String(user.id)
    );
  }, [allModifications, isResearcher, user?.id]);

  // Calculate new modifications (created in last 24 hours)
  useEffect(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newMods = researcherModifications.filter((mod) => {
      const createdDate = new Date(mod.created_at || mod.createdAt);
      return createdDate > oneDayAgo;
    });
    setNewModificationsCount(newMods.length);
  }, [researcherModifications]);

  const researcherTabs = useMemo(
    () => [
      {
        key: "liked",
        label: "Termes appréciés",
        badge: newLikedTermsCount > 0 ? newLikedTermsCount : null,
      },
      {
        key: "modifications",
        label: "Modifications proposées",
        badge: newModificationsCount > 0 ? newModificationsCount : null,
      },
      {
        key: "reports",
        label: "Signalements effectués",
        badge: newUserReportsCount > 0 ? newUserReportsCount : null,
      },
      { key: "activities", label: "Activités totales" },
    ],
    [newLikedTermsCount, newModificationsCount, newUserReportsCount]
  );

  // Section 1: My Content (what I created)
  const authorMyContentTabs = useMemo(
    () => [
      {
        key: "terms",
        label: "Mes termes",
        badge: newUserTermsCount > 0 ? newUserTermsCount : null,
      },
      {
        key: "comments-received",
        label: "Commentaires reçus",
        badge: newCommentsCount > 0 ? newCommentsCount : null,
      },
      {
        key: "reports-received",
        label: "Signalements reçus",
        badge: newReceivedReportsCount > 0 ? newReceivedReportsCount : null,
      },
      {
        key: "likes-received",
        label: "Likes reçus",
        badge: null,
      },
    ],
    [newUserTermsCount, newCommentsCount, newReceivedReportsCount]
  );

  // Section 2: My Activities (my interactions with others' content)
  const authorMyActivitiesTabs = useMemo(
    () => [
      {
        key: "pending-validation",
        label: "Modifications à valider",
        badge: newPendingValidationCount > 0 ? newPendingValidationCount : null,
      },
      {
        key: "my-likes",
        label: "Mes likes",
        badge: newLikedTermsCount > 0 ? newLikedTermsCount : null,
      },
      {
        key: "my-comments",
        label: "Mes commentaires",
        badge: null,
      },
    ],
    [newPendingValidationCount, newLikedTermsCount]
  );

  const authorTabs = useMemo(
    () => [
      {
        key: "comments",
        label: "Commentaires",
        badge: newCommentsCount > 0 ? newCommentsCount : null,
      },
      {
        key: "pending-validation",
        label: "À valider",
        badge: newPendingValidationCount > 0 ? newPendingValidationCount : null,
      },
      {
        key: "liked",
        label: "Termes aimés",
        badge: newLikedTermsCount > 0 ? newLikedTermsCount : null,
      },
      {
        key: "terms",
        label: "Mes termes",
        badge: newUserTermsCount > 0 ? newUserTermsCount : null,
      },
      {
        key: "reports-received",
        label: "Signalements",
        badge: newReceivedReportsCount > 0 ? newReceivedReportsCount : null,
      },
    ],
    [
      newCommentsCount,
      newPendingValidationCount,
      newLikedTermsCount,
      newUserTermsCount,
      newReceivedReportsCount,
    ]
  );

  const documentsCount = statsData.documents || 0;

  // Pagination helpers
  const getPaginatedItems = useCallback(
    (items, page) => {
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return items.slice(startIndex, endIndex);
    },
    [itemsPerPage]
  );

  const getTotalPages = useCallback(
    (items) => {
      return Math.max(1, Math.ceil(items.length / itemsPerPage));
    },
    [itemsPerPage]
  );

  // Paginated data
  const paginatedComments = useMemo(
    () => getPaginatedItems(userComments, commentsPage),
    [userComments, commentsPage, getPaginatedItems]
  );

  const paginatedMyComments = useMemo(
    () => getPaginatedItems(myComments, myCommentsPage),
    [myComments, myCommentsPage, getPaginatedItems]
  );

  const submitReply = useCallback(
    async (comment) => {
      try {
        const termId = comment.term?.id || comment.termId;
        const parentId = comment.id;
        const content = (replyDrafts[parentId] || "").trim();
        if (!termId || !parentId || !content) return;
        setReplySubmitting((prev) => ({ ...prev, [parentId]: true }));
        await apiService.addReply(termId, parentId, content);
        // Refetch my comments so the new reply appears in the list with proper term metadata
        try {
          const latest = await apiService.getMyComments();
          const comments = Array.isArray(latest?.data)
            ? latest.data
            : Array.isArray(latest)
            ? latest
            : [];
          setMyComments(comments);
        } catch (e) {
          console.warn("Could not refresh my comments after reply:", e);
        }
        setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }));
        toast({
          title: "Réponse publiée",
          description: "Votre réponse a été ajoutée.",
        });
      } catch (e) {
        console.error("Reply failed:", e);
        toast({
          title: "Échec de l'envoi",
          description: "Impossible d'envoyer votre réponse pour le moment.",
          variant: "destructive",
        });
      } finally {
        setReplySubmitting((prev) => ({ ...prev, [parentId]: false }));
      }
    },
    [replyDrafts, toast]
  );

  const paginatedLikedTerms = useMemo(
    () => getPaginatedItems(likedTerms, likedTermsPage),
    [likedTerms, likedTermsPage, getPaginatedItems]
  );

  const paginatedUserTerms = useMemo(
    () => getPaginatedItems(userTerms, userTermsPage),
    [userTerms, userTermsPage, getPaginatedItems]
  );

  const paginatedReports = useMemo(
    () => getPaginatedItems(userReports, reportsPage),
    [userReports, reportsPage, getPaginatedItems]
  );

  const paginatedPendingValidation = useMemo(
    () => getPaginatedItems(pendingValidationMods, pendingValidationPage),
    [pendingValidationMods, pendingValidationPage, getPaginatedItems]
  );

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

  const renderTabContent = useCallback(
    (tabKey = activeTab) => {
      switch (tabKey) {
        // New tab for likes received
        case "likes-received":
          if (receivedLikesLoading) {
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des likes reçus...
              </div>
            );
          }

          if (!receivedLikes || receivedLikes.length === 0) {
            return (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Aucun like reçu</p>
                <p className="text-sm">
                  Vos termes n'ont pas encore été aimés par d'autres
                  utilisateurs.
                </p>
              </div>
            );
          }

          // Apply filters
          const qRL = (contentFilters.q || "").toLowerCase().trim();
          const filteredReceivedLikes = receivedLikes.filter((like) => {
            const textMatch =
              !qRL ||
              (like?.user?.name || "").toLowerCase().includes(qRL) ||
              (like?.term?.name || "").toLowerCase().includes(qRL);
            const dateMatch = inRange(
              like?.likedAt,
              contentFilters.from,
              contentFilters.to
            );
            return textMatch && dateMatch;
          });

          const totalReceivedLikes = filteredReceivedLikes.length;
          const startIndex = (receivedLikesPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedReceivedLikes = filteredReceivedLikes.slice(
            startIndex,
            endIndex
          );
          const totalPagesReceivedLikes = Math.ceil(
            totalReceivedLikes / itemsPerPage
          );

          return (
            <div className="space-y-4">
              {renderFilters(contentFilters, setContentFilters)}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Résultats :{" "}
                  <span className="font-bold text-lg text-primary">
                    {totalReceivedLikes}
                  </span>
                  {filteredReceivedLikes.length !== receivedLikes.length && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      / {receivedLikes.length} au total
                    </span>
                  )}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-semibold text-sm border-b">
                        Qui a aimé
                      </th>
                      <th className="text-left p-3 font-semibold text-sm border-b">
                        Terme aimé
                      </th>
                      <th className="text-left p-3 font-semibold text-sm border-b">
                        Date
                      </th>
                      <th className="text-center p-3 font-semibold text-sm border-b w-16">
                        <Heart className="h-4 w-4 mx-auto text-pink-500" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReceivedLikes.map((like) => (
                      <tr
                        key={like.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3">
                          <Link
                            to={`/author/${like.user.id}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors group"
                          >
                            <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                              <AvatarImage src={like.user.profilePicture} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                {(like.user.name || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {like.user.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {like.user.role === "researcher"
                                  ? "Chercheur"
                                  : like.user.role === "author"
                                  ? "Auteur"
                                  : like.user.role === "admin"
                                  ? "Admin"
                                  : "Utilisateur"}
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td className="p-3">
                          <Link
                            to={`/fiche/${like.term.slug || like.term.id}`}
                            className="group flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-medium text-primary hover:underline">
                                {like.term.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Cliquez pour voir le terme
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(like.likedAt).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            <Heart className="h-5 w-5 fill-pink-500 text-pink-500 animate-pulse" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPagesReceivedLikes > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setReceivedLikesPage((p) =>
                        Math.min(totalPagesReceivedLikes, p + 1)
                      )
                    }
                    disabled={receivedLikesPage === totalPagesReceivedLikes}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </div>
          );

        case "my-likes":
        case "liked":
          if (likedTermsLoading) {
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de vos termes aimés...
              </div>
            );
          }

          // Apply filters to liked terms
          const qLT = (activityFilters.q || "").toLowerCase().trim();
          const filteredLikedTerms = (likedTerms || []).filter((item) => {
            const textMatch =
              !qLT ||
              (item?.term || "").toLowerCase().includes(qLT) ||
              (item?.definition || "").toLowerCase().includes(qLT);
            const dateMatch = inRange(
              item?.likedAt,
              activityFilters.from,
              activityFilters.to
            );
            return textMatch && dateMatch;
          });

          const paginatedLikedFiltered = getPaginatedItems(
            filteredLikedTerms,
            likedTermsPage
          );

          return filteredLikedTerms.length > 0 ? (
            <div className="overflow-x-auto">
              {renderFilters(activityFilters, setActivityFilters)}
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Terme</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left">Aimé le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedLikedFiltered.map((term) => (
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
              {/* Pagination for Liked Terms */}
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setLikedTermsPage((p) => Math.max(1, p - 1))
                      }
                      className={
                        likedTermsPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: getTotalPages(filteredLikedTerms) },
                    (_, i) => i + 1
                  ).map((page) => {
                    const totalPages = getTotalPages(filteredLikedTerms);
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - likedTermsPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setLikedTermsPage(page)}
                            isActive={likedTermsPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === likedTermsPage - 2 ||
                      page === likedTermsPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setLikedTermsPage((p) =>
                          Math.min(getTotalPages(filteredLikedTerms), p + 1)
                        )
                      }
                      className={
                        likedTermsPage === getTotalPages(filteredLikedTerms)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Aucun terme aimé pour le moment.
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
                  {paginatedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link
                          to={
                            report.term_slug
                              ? `/fiche/${report.term_slug}`
                              : "#"
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
              {/* Pagination for Reports */}
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setReportsPage((p) => Math.max(1, p - 1))}
                      className={
                        reportsPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: getTotalPages(userReports) },
                    (_, i) => i + 1
                  ).map((page) => {
                    const totalPages = getTotalPages(userReports);
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - reportsPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setReportsPage(page)}
                            isActive={reportsPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === reportsPage - 2 ||
                      page === reportsPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setReportsPage((p) =>
                          Math.min(getTotalPages(userReports), p + 1)
                        )
                      }
                      className={
                        reportsPage === getTotalPages(userReports)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Vous n'avez pas encore signalé de terme. Visitez une fiche pour
              signaler un problème.
            </div>
          );

        case "reports-received":
          if (receivedReportsLoading) {
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des signalements sur vos termes...
              </div>
            );
          }
          return receivedReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Terme</th>
                    <th className="px-4 py-3 text-left">Raison</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {receivedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link
                          to={
                            report.term_slug
                              ? `/fiche/${report.term_slug}`
                              : "#"
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
                            ? "Revu"
                            : report.status === "ignored"
                            ? "Ignoré"
                            : "En attente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(report.created_at || report.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setReportDetails(report)}
                          className="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Aucun signalement sur vos termes.
            </div>
          );

        // Alias for comments-received
        case "comments-received":
        case "comments":
          if (commentsLoading) {
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des commentaires...
              </div>
            );
          }

          // Apply filters to received comments
          const qCR = (contentFilters.q || "").toLowerCase().trim();
          const filteredUserComments = (userComments || []).filter((c) => {
            const termTitle = (
              c?.term?.title ||
              c?.termTitle ||
              ""
            ).toLowerCase();
            const authorName = (c?.authorName || "").toLowerCase();
            const content = (c?.content || "").toLowerCase();
            const textMatch =
              !qCR ||
              termTitle.includes(qCR) ||
              authorName.includes(qCR) ||
              content.includes(qCR);
            const dateMatch = inRange(
              c?.createdAt,
              contentFilters.from,
              contentFilters.to
            );
            return textMatch && dateMatch;
          });

          const pageComments = getPaginatedItems(
            filteredUserComments,
            commentsPage
          );

          return filteredUserComments.length > 0 ? (
            <div className="overflow-x-auto">
              {renderFilters(contentFilters, setContentFilters)}
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Terme</th>
                    <th className="px-4 py-3 text-left">Auteur</th>
                    <th className="px-4 py-3 text-left">Commentaire</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pageComments.map((comment) => {
                    const isNew =
                      new Date(comment.createdAt) >
                      new Date(Date.now() - 24 * 60 * 60 * 1000);
                    // Use nested term object from backend response
                    const termSlug = comment.term?.slug || comment.termSlug;
                    const termTitle =
                      comment.term?.title || comment.termTitle || "Terme";
                    const commentLink = termSlug
                      ? `/fiche/${termSlug}#comment-${comment.id}`
                      : "#";
                    return (
                      <tr
                        key={comment.id}
                        className={`group hover:bg-muted/40 hover:shadow-sm transition-all ${
                          isNew ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <Link
                            to={commentLink}
                            className={
                              termSlug
                                ? "text-primary hover:underline inline-flex items-center gap-1"
                                : "text-foreground"
                            }
                          >
                            {termTitle}
                            {termSlug && <ExternalLink className="h-3 w-3" />}
                            {isNew && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Nouveau
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {comment.authorName || "Anonyme"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-md">
                          <div className="line-clamp-2">{comment.content}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {termSlug && (
                            <Link
                              to={commentLink}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition-colors"
                            >
                              Voir plus
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination for Comments */}
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                      className={
                        commentsPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: getTotalPages(filteredUserComments) },
                    (_, i) => i + 1
                  ).map((page) => {
                    const totalPages = getTotalPages(filteredUserComments);
                    // Show first, last, current, and neighbors
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - commentsPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCommentsPage(page)}
                            isActive={commentsPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === commentsPage - 2 ||
                      page === commentsPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCommentsPage((p) =>
                          Math.min(getTotalPages(filteredUserComments), p + 1)
                        )
                      }
                      className={
                        commentsPage === getTotalPages(filteredUserComments)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Aucun commentaire sur vos termes pour le moment.
            </div>
          );

        case "my-comments":
          if (myCommentsLoading) {
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement de vos
                commentaires...
              </div>
            );
          }

          // Apply filters to my comments
          const qMC = (activityFilters.q || "").toLowerCase().trim();
          const filteredMyComments = (myComments || []).filter((c) => {
            const termTitle = (
              c?.term?.title ||
              c?.termTitle ||
              ""
            ).toLowerCase();
            const content = (c?.content || "").toLowerCase();
            const textMatch =
              !qMC || termTitle.includes(qMC) || content.includes(qMC);
            const dateMatch = inRange(
              c?.createdAt,
              activityFilters.from,
              activityFilters.to
            );
            return textMatch && dateMatch;
          });

          const pageMyComments = getPaginatedItems(
            filteredMyComments,
            myCommentsPage
          );

          return filteredMyComments.length > 0 ? (
            <div className="overflow-x-auto">
              {renderFilters(activityFilters, setActivityFilters)}
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Terme</th>
                    <th className="px-4 py-3 text-left">Commentaire</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pageMyComments.map((comment) => {
                    const termTitle =
                      comment.term?.title || comment.termTitle || "Terme";
                    const link = comment.term?.link || comment.link;
                    return (
                      <tr key={comment.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {termTitle}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-md">
                          <div className="space-y-2">
                            <div className="line-clamp-2">
                              {comment.content}
                            </div>
                            <div className="mt-2">
                              <Textarea
                                placeholder="Répondre..."
                                value={replyDrafts[comment.id] || ""}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({
                                    ...prev,
                                    [comment.id]: e.target.value,
                                  }))
                                }
                                className="min-h-[60px]"
                              />
                              <div className="mt-2 flex justify-end">
                                <Button
                                  size="sm"
                                  disabled={
                                    replySubmitting[comment.id] ||
                                    !(replyDrafts[comment.id] || "").trim()
                                  }
                                  onClick={() => submitReply(comment)}
                                >
                                  {replySubmitting[comment.id] ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />{" "}
                                      Envoi...
                                    </>
                                  ) : (
                                    "Répondre"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {link && (
                            <Link
                              to={link}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition-colors"
                            >
                              Voir plus <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setMyCommentsPage((p) => Math.max(1, p - 1))
                      }
                      className={
                        myCommentsPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: getTotalPages(filteredMyComments) },
                    (_, i) => i + 1
                  ).map((page) => {
                    const totalPages = getTotalPages(filteredMyComments);
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - myCommentsPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setMyCommentsPage(page)}
                            isActive={myCommentsPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === myCommentsPage - 2 ||
                      page === myCommentsPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setMyCommentsPage((p) =>
                          Math.min(getTotalPages(filteredMyComments), p + 1)
                        )
                      }
                      className={
                        myCommentsPage === getTotalPages(filteredMyComments)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Vous n'avez pas encore laissé de commentaires.
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
                Utilisez l'espace Documents de recherche pour ajouter vos
                études, ressources ou notes personnelles.
              </p>
              <Link
                to="/documents"
                className="inline-flex items-center text-primary font-medium hover:underline"
              >
                Gérer mes documents
              </Link>
            </div>
          );

        case "pending-validation":
          if (pendingValidationLoading) {
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des modifications en attente...
              </div>
            );
          }

          // Apply filters to pending validation
          const qPV = (activityFilters.q || "").toLowerCase().trim();
          const filteredPending = (pendingValidationMods || []).filter((m) => {
            const termTitle = (
              m?.term_title ||
              m?.termTitle ||
              ""
            ).toLowerCase();
            const proposer = (
              [m?.proposer_firstname, m?.proposer_lastname]
                .filter(Boolean)
                .join(" ") ||
              m?.proposer_email ||
              ""
            ).toLowerCase();
            const textMatch =
              !qPV || termTitle.includes(qPV) || proposer.includes(qPV);
            const dateMatch = inRange(
              m?.created_at || m?.createdAt,
              activityFilters.from,
              activityFilters.to
            );
            return textMatch && dateMatch;
          });

          const pagePending = getPaginatedItems(
            filteredPending,
            pendingValidationPage
          );

          return filteredPending.length > 0 ? (
            <div className="overflow-x-auto">
              {renderFilters(activityFilters, setActivityFilters)}
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>
                    Validez les modifications proposées par d'autres
                    utilisateurs sur vos termes.
                  </strong>{" "}
                  Vous ne pouvez pas valider vos propres propositions.
                </p>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Terme</th>
                    <th className="px-4 py-3 text-left">Proposée par</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pagePending.map((modification) => {
                    const proposerName =
                      [
                        modification.proposer_firstname,
                        modification.proposer_lastname,
                      ]
                        .filter(Boolean)
                        .join(" ") ||
                      modification.proposer_email ||
                      "Utilisateur inconnu";

                    const isNew =
                      new Date(
                        modification.created_at || modification.createdAt
                      ) > new Date(Date.now() - 24 * 60 * 60 * 1000);

                    return (
                      <tr
                        key={modification.id}
                        className={`group hover:bg-muted/40 hover:shadow-sm transition-all ${
                          isNew ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <Link
                            to={
                              modification.term_slug
                                ? `/fiche/${modification.term_slug}`
                                : "#"
                            }
                            className={
                              modification.term_slug
                                ? "text-primary hover:underline inline-flex items-center gap-1"
                                : "text-foreground"
                            }
                          >
                            {modification.term_title || "Terme inconnu"}
                            {modification.term_slug && (
                              <ExternalLink className="h-3 w-3" />
                            )}
                            {isNew && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Nouveau
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {proposerName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(
                            modification.created_at || modification.createdAt
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewChanges(modification)}
                              className="px-3 py-1.5 text-xs font-medium text-primary border border-primary hover:bg-primary/10 rounded transition-colors"
                              title="Voir les changements proposés"
                            >
                              Voir changements
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleModificationValidation(
                                  modification.id,
                                  "approve"
                                )
                              }
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors inline-flex items-center gap-1"
                              title="Approuver la modification"
                            >
                              <Check className="h-3 w-3" /> Approuver
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleModificationValidation(
                                  modification.id,
                                  "reject"
                                )
                              }
                              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors inline-flex items-center gap-1"
                              title="Rejeter la modification"
                            >
                              <X className="h-3 w-3" /> Rejeter
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination for Pending Validation */}
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setPendingValidationPage((p) => Math.max(1, p - 1))
                      }
                      className={
                        pendingValidationPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: getTotalPages(filteredPending) },
                    (_, i) => i + 1
                  ).map((page) => {
                    const totalPages = getTotalPages(filteredPending);
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - pendingValidationPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setPendingValidationPage(page)}
                            isActive={pendingValidationPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === pendingValidationPage - 2 ||
                      page === pendingValidationPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPendingValidationPage((p) =>
                          Math.min(getTotalPages(filteredPending), p + 1)
                        )
                      }
                      className={
                        pendingValidationPage === getTotalPages(filteredPending)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Aucune modification en attente de validation pour le moment.
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
                              onClick={() =>
                                handleEditModification(modification)
                              }
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
              Vous n'avez pas encore propose de modification. Rendez-vous sur
              une fiche pour suggerer une amelioration.
            </div>
          );

        case "terms":
          // Apply filters to user terms
          const qUT = (contentFilters.q || "").toLowerCase().trim();
          const filteredUserTerms = (userTerms || []).filter((t) => {
            const title = (t?.term || "").toLowerCase();
            const category = (t?.category || "").toLowerCase();
            const textMatch =
              !qUT || title.includes(qUT) || category.includes(qUT);
            const dateMatch = inRange(
              t?.created_at || t?.createdAt,
              contentFilters.from,
              contentFilters.to
            );
            return textMatch && dateMatch;
          });

          const pageUserTerms = getPaginatedItems(
            filteredUserTerms,
            userTermsPage
          );

          return filteredUserTerms.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Gérez vos termes soumis et vos brouillons.
              </div>
              {renderFilters(contentFilters, setContentFilters)}
              {pageUserTerms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background/50 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <Link
                      to={`/fiche/${term.slug}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {term.term}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {term.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        term.status === "published"
                          ? "bg-green-100 text-green-800"
                          : term.status === "review"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {term.status === "published"
                        ? "Publié"
                        : term.status === "review"
                        ? "En révision"
                        : "Brouillon"}
                    </span>
                    <Link
                      to={`/edit/${term.slug}`}
                      className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                      title="Éditer le terme"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
              {/* Pagination for User Terms */}
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setUserTermsPage((p) => Math.max(1, p - 1))
                      }
                      className={
                        userTermsPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: getTotalPages(filteredUserTerms) },
                    (_, i) => i + 1
                  ).map((page) => {
                    const totalPages = getTotalPages(filteredUserTerms);
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - userTermsPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setUserTermsPage(page)}
                            isActive={userTermsPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === userTermsPage - 2 ||
                      page === userTermsPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setUserTermsPage((p) =>
                          Math.min(getTotalPages(filteredUserTerms), p + 1)
                        )
                      }
                      className={
                        userTermsPage === getTotalPages(filteredUserTerms)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Aucune contribution pour le moment
              </h3>
              <p className="text-muted-foreground mb-6">
                Commencez par ajouter un nouveau terme au dictionnaire.
              </p>
              <Link to="/submit">
                <button className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" />
                  Ajouter votre premier terme
                </button>
              </Link>
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
    },
    [
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
      userComments,
      commentsLoading,
    ]
  );

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

  // Report Details Modal
  const ReportDetailsDialog = () => {
    if (!reportDetails) return null;
    const current = reportDetails;

    const allStatuses = [
      { value: "pending", label: "En attente" },
      { value: "reviewed", label: "Examiné" },
      { value: "resolved", label: "Résolu" },
      { value: "ignored", label: "Ignoré" },
      { value: "accepted", label: "Accepté" },
    ];

    const copyToClipboard = (text, label) => {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copié !",
        description: `${label} copié dans le presse-papiers`,
        duration: 2000,
      });
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && setReportDetails(null)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <h3 className="text-lg font-semibold">
                  Détails du signalement
                </h3>
                <p className="text-xs text-muted-foreground">
                  Rapport #{current.id}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReportDetails(null)}
              className="p-1.5 rounded-lg hover:bg-background transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Term */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-primary" />
                <div className="text-xs text-muted-foreground">
                  Terme signalé
                </div>
              </div>
              <div className="font-semibold">
                {current.term_title || current.termTitle || "Terme"}
              </div>
            </div>

            {/* Reason */}
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">Raison</div>
              <div className="font-medium">{current.reason || "—"}</div>
            </div>

            {/* Reporter Info */}
            <div className="p-4 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">
                  Informations du rapporteur
                </h4>
              </div>
              <div className="space-y-2.5">
                {/* Name */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">
                      Nom:
                    </span>
                    <span className="font-medium">
                      {current.reporter_name ||
                        `${current.firstname || ""} ${
                          current.lastname || ""
                        }`.trim() ||
                        "—"}
                    </span>
                  </div>
                  {current.reporter_name && (
                    <button
                      onClick={() =>
                        copyToClipboard(current.reporter_name, "Nom")
                      }
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
                      title="Copier"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <a
                      href={`mailto:${current.reporter_email}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {current.reporter_email || "—"}
                    </a>
                  </div>
                  {current.reporter_email && (
                    <button
                      onClick={() =>
                        copyToClipboard(current.reporter_email, "Email")
                      }
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
                      title="Copier"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Phone */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <a
                      href={`tel:${current.reporter_phone}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {current.reporter_phone || "—"}
                    </a>
                  </div>
                  {current.reporter_phone && (
                    <button
                      onClick={() =>
                        copyToClipboard(current.reporter_phone, "Téléphone")
                      }
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
                      title="Copier"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            {current.details && (
              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Détails</div>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-32 overflow-y-auto">
                  {current.details}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  Statut actuel
                </div>
                <span className="inline-flex items-center text-xs px-3 py-1.5 rounded-full bg-muted font-medium">
                  {current.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Changer le statut
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-1.5 bg-background text-sm hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  disabled={updatingReportStatus}
                  value={(current.status || "").toLowerCase()}
                  onChange={(e) =>
                    handleUpdateReportStatus(current.id, e.target.value)
                  }
                >
                  {allStatuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
              <span>
                Créé: {formatDate(current.created_at || current.createdAt)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-5 py-3 flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border hover:bg-muted text-sm transition-colors"
              onClick={() => setReportDetails(null)}
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Include dialogs in render

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
      <ReportDetailsDialog />
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
                  <span className="creative-gradient-text">{fullName}</span> !
                </h1>
                <p className="text-muted-foreground text-lg">
                  {isResearcher
                    ? "Bienvenue sur votre espace de recherche collaboratif."
                    : isAuthor
                    ? "Bienvenue sur votre espace de création et contribution."
                    : "Bienvenue sur votre tableau de bord personnel."}
                </p>
              </div>
              {(isAuthor || user?.role === "admin") && !needsAuthorApproval && (
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

          {isRejectedLike && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="rounded-3xl border border-red-300/60 bg-red-50 dark:bg-red-950/10 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Votre demande d'auteur a été rejetée
                  </h2>
                  <p className="text-sm text-red-900/90 dark:text-red-100/90 mb-4">
                    Vous êtes désormais en mode{" "}
                    <span className="font-semibold">Chercheur</span>. Continuez
                    à explorer, aimer des termes et proposer des améliorations.
                    Amusez-vous bien !
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/search" className="inline-flex">
                      <Button>Explorer les termes</Button>
                    </Link>
                    <Link to="/profile" className="inline-flex">
                      <Button variant="outline">Améliorer mon profil</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {statsLoading ? (
            <div className="flex items-center justify-center gap-3 mb-8 p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">
                Chargement de vos statistiques...
              </span>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 gap-6 mb-8 auto-rows-fr ${
                isResearcher ? "md:grid-cols-4" : "md:grid-cols-6"
              }`}
            >
              {statCards.map((stat) => {
                // Destructure to exclude badge from being passed to StatCard
                const { badge, ...statWithoutBadge } = stat;

                // Determine which section this tab belongs to
                const contentTabs = [
                  "terms",
                  "comments",
                  "comments-received",
                  "reports-received",
                  "likes-received",
                ];
                const activityTabs = [
                  "pending-validation",
                  "liked",
                  "my-likes",
                  "my-comments",
                ];
                const section = contentTabs.includes(stat.tabKey)
                  ? "content"
                  : activityTabs.includes(stat.tabKey)
                  ? "activity"
                  : null;

                // Determine which active state to check
                const isActive =
                  section === "content"
                    ? stat.tabKey === activeContentTab
                    : section === "activity"
                    ? stat.tabKey === activeActivityTab
                    : stat.tabKey === activeTab;

                return (
                  <StatCard
                    key={stat.title}
                    {...statWithoutBadge}
                    onClick={
                      (isResearcher || isAuthor || user?.role === "admin") &&
                      stat.tabKey
                        ? () => handleTabClick(stat.tabKey, section)
                        : undefined
                    }
                    active={
                      (isResearcher || isAuthor || user?.role === "admin") &&
                      isActive
                    }
                    badge={undefined}
                  />
                );
              })}
            </div>
          )}

          {/* Researcher Tabs */}
          {isResearcher && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10"
            >
              <div className="rounded-3xl border border-border/60 bg-background/70 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="flex flex-wrap gap-2 p-6 pb-4">
                  {researcherTabs.map((tab) => {
                    const unseen = Math.max(
                      0,
                      (tab.badge || 0) - Number(lastSeenCounts[tab.key] || 0)
                    );
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => handleTabClick(tab.key)}
                        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeTab === tab.key
                            ? "bg-primary text-white shadow"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                        {unseen > 0 && !viewedTabs.has(tab.key) && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform bg-red-500 rounded-full min-w-[1.25rem]">
                            {unseen}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="px-6 pb-6">{renderTabContent()}</div>
              </div>
            </motion.div>
          )}

          {/* Pending Author Info Section */}
          {needsAuthorApproval && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-10"
            >
              <div className="rounded-3xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/10 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Votre statut d'auteur est en attente
                  </h2>
                  <p className="text-sm text-amber-900/90 dark:text-amber-100/90 mb-4">
                    Merci pour votre inscription en tant qu'auteur. Votre
                    demande a bien été reçue et doit être validée par un
                    administrateur. Vous recevrez une notification dès que votre
                    accès sera activé.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 rounded-lg bg-white/70 dark:bg-amber-950/20 border border-amber-200/60">
                      <h3 className="font-semibold mb-1">
                        Étape 1 — Vérification
                      </h3>
                      <p className="text-muted-foreground">
                        Nous vérifions vos informations de profil et éventuels
                        documents fournis.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/70 dark:bg-amber-950/20 border border-amber-200/60">
                      <h3 className="font-semibold mb-1">
                        Étape 2 — Validation
                      </h3>
                      <p className="text-muted-foreground">
                        Un administrateur examine votre demande et valide votre
                        statut.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/70 dark:bg-amber-950/20 border border-amber-200/60">
                      <h3 className="font-semibold mb-1">
                        Étape 3 — Activation
                      </h3>
                      <p className="text-muted-foreground">
                        Votre compte auteur passe en actif. Vous pourrez alors
                        proposer et modifier des termes.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/profile" className="inline-flex">
                      <Button variant="outline">Compléter mon profil</Button>
                    </Link>
                    <a
                      href="mailto:support@dictionnaire.fr"
                      className="inline-flex"
                    >
                      <Button variant="ghost">Contacter le support</Button>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Author Tabs - Section 1: My Content */}
          {(isAuthor || user?.role === "admin") && !needsAuthorApproval && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10"
            >
              <div className="rounded-3xl border border-border/60 bg-background/70 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Mes Contenus
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {authorMyContentTabs.map((tab) => {
                      const unseen = Math.max(
                        0,
                        (tab.badge || 0) - Number(lastSeenCounts[tab.key] || 0)
                      );
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => handleTabClick(tab.key, "content")}
                          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            activeContentTab === tab.key
                              ? "bg-primary text-white shadow"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab.label}
                          {unseen > 0 && !viewedTabs.has(tab.key) && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform bg-red-500 rounded-full min-w-[1.25rem]">
                              {unseen}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div>{renderTabContent(activeContentTab)}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Author Tabs - Section 2: My Activities */}
          {(isAuthor || user?.role === "admin") && !needsAuthorApproval && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-10"
            >
              <div className="rounded-3xl border border-border/60 bg-background/70 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Mes Activités
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {authorMyActivitiesTabs.map((tab) => {
                      const unseen = Math.max(
                        0,
                        (tab.badge || 0) - Number(lastSeenCounts[tab.key] || 0)
                      );
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => handleTabClick(tab.key, "activity")}
                          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            activeActivityTab === tab.key
                              ? "bg-primary text-white shadow"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab.label}
                          {unseen > 0 && !viewedTabs.has(tab.key) && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform bg-red-500 rounded-full min-w-[1.25rem]">
                              {unseen}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div>{renderTabContent(activeActivityTab)}</div>
                </div>
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

          {isResearcher && (
            <UserTermsList
              userTerms={userTerms}
              loading={loading}
              user={user}
            />
          )}
        </div>
      </div>
      {/* View Changes Dialog */}
      <Dialog open={viewChangesOpen} onOpenChange={setViewChangesOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Changements proposés</DialogTitle>
            <DialogDescription>
              Comparaison du terme actuel et de la proposition:{" "}
              {viewTitle || "—"}
            </DialogDescription>
          </DialogHeader>

          {viewLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Préparation de
              l'aperçu...
            </div>
          ) : viewBefore && viewAfter && viewChangedKeys.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Terme actuel</h4>
                <div className="space-y-3 text-sm">
                  {viewChangedKeys.includes("term") && (
                    <div>
                      <div className="text-muted-foreground text-xs">Terme</div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-muted/40">
                        {formatFieldValue("term", viewBefore.term)}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("definition") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Définition
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-muted/40">
                        {formatFieldValue("definition", viewBefore.definition)}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("categorie_id") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Catégorie (ID)
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-muted/40">
                        {formatFieldValue(
                          "categorie_id",
                          viewBefore.categorie_id
                        )}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("exemples") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Exemples
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-muted/40">
                        • {formatFieldValue("exemples", viewBefore.exemples)}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("sources") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Sources
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-muted/40">
                        • {formatFieldValue("sources", viewBefore.sources)}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("remarques") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Remarques
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-muted/40">
                        • {formatFieldValue("remarques", viewBefore.remarques)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Proposition</h4>
                <div className="space-y-3 text-sm">
                  {viewChangedKeys.includes("term") && (
                    <div>
                      <div className="text-muted-foreground text-xs">Terme</div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-green-50 dark:bg-green-950/20">
                        {formatFieldValue("term", viewAfter.term)}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("definition") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Définition
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-green-50 dark:bg-green-950/20">
                        {formatFieldValue("definition", viewAfter.definition)}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("categorie_id") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Catégorie (ID)
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-green-50 dark:bg-green-950/20">
                        {formatFieldValue(
                          "categorie_id",
                          viewAfter.categorie_id
                        )}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("exemples") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Exemples
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-green-50 dark:bg-green-950/20">
                        • {formatFieldValue("exemples", viewAfter.exemples)}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("sources") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Sources
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-green-50 dark:bg-green-950/20">
                        • {formatFieldValue("sources", viewAfter.sources)}
                      </div>
                    </div>
                  )}
                  {viewChangedKeys.includes("remarques") && (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Remarques
                      </div>
                      <div className="whitespace-pre-wrap p-2 rounded bg-green-50 dark:bg-green-950/20">
                        • {formatFieldValue("remarques", viewAfter.remarques)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Aucun changement détecté.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pending Author Modal */}
      <Dialog open={pendingModalOpen} onOpenChange={setPendingModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Votre rôle d'auteur est en attente</DialogTitle>
            <DialogDescription>
              Vous avez demandé un accès auteur. Veuillez patienter pendant la
              validation par un administrateur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              En attendant, vous pouvez compléter votre profil pour accélérer la
              vérification ou consulter les termes existants.
            </p>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Complétez vos informations et documents dans votre profil</li>
              <li>Vous serez notifié dès l'activation</li>
              <li>Durée habituelle: 24 à 72 heures</li>
            </ul>
            <div className="flex gap-2 pt-2">
              <Link to="/profile" className="inline-flex">
                <Button>Aller à mon profil</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setPendingModalOpen(false)}
              >
                Compris
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Author Rejection Modal */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Votre demande d'auteur a été rejetée</DialogTitle>
            <DialogDescription>
              Votre compte a été basculé en Chercheur. Vous pouvez toujours
              explorer, aimer des termes et proposer des améliorations.
              Amusez-vous bien !
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              Besoin d'aide ou d'un second avis ? Vous pouvez compléter votre
              profil et recontacter l'équipe si nécessaire.
            </p>
            <div className="flex gap-2 pt-2 flex-wrap">
              <Link to="/search" className="inline-flex">
                <Button>Explorer les termes</Button>
              </Link>
              <Link to="/profile" className="inline-flex">
                <Button variant="outline">Améliorer mon profil</Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setRejectionModalOpen(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {ConfirmDialog}
    </>
  );
};

export default Dashboard;

const normalizeCollectionForForm = (collection) => {
  // Accept arrays, single objects/strings, and newline-separated strings.
  const arrayValue = Array.isArray(collection)
    ? collection
    : typeof collection === "string"
    ? collection.split(/\r?\n/)
    : collection
    ? [collection]
    : [];

  const normalized = arrayValue
    .flatMap((item) => {
      if (!item) return [];
      if (typeof item === "string") {
        const parts = item
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        return parts.map((text) => ({ text }));
      }
      if (typeof item === "object") {
        const textCandidate =
          (typeof item.text === "string" && item.text.trim()) ||
          (typeof item.value === "string" && item.value.trim()) ||
          (typeof item.label === "string" && item.label.trim()) ||
          (typeof item.term === "string" && item.term.trim()) ||
          (typeof item.url === "string" && item.url.trim()) ||
          "";
        return textCandidate ? [{ text: textCandidate }] : [];
      }
      return [];
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
  // Accept arrays, single objects/strings, and newline-separated strings.
  const arrayValue = Array.isArray(collection)
    ? collection
    : typeof collection === "string"
    ? collection.split(/\r?\n/)
    : collection
    ? [collection]
    : [];

  return arrayValue
    .flatMap((item) => {
      if (!item) return [];
      if (typeof item === "string") {
        const parts = item
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        return parts.map((text) => ({ text }));
      }
      if (typeof item === "object") {
        const textCandidate =
          (typeof item.text === "string" && item.text.trim()) ||
          (typeof item.value === "string" && item.value.trim()) ||
          (typeof item.label === "string" && item.label.trim()) ||
          (typeof item.term === "string" && item.term.trim()) ||
          (typeof item.url === "string" && item.url.trim()) ||
          "";
        return textCandidate ? [{ text: textCandidate }] : [];
      }
      return [];
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
      termData.exemples || termData.examples || termData.exemple || []
    ),
    sources: normalizeCollectionForForm(
      termData.sources || termData.source || []
    ),
    remarques: normalizeCollectionForForm(
      termData.remarques || termData.remarks || termData.remarque || []
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
