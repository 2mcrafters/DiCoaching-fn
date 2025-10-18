import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useDispatch, useSelector } from "react-redux";
import { selectAllTerms, fetchTerms } from "@/features/terms/termsSlice";
import { selectAllUsers, fetchUsers } from "@/features/users/usersSlice";
import { createReport } from "@/features/reports/reportsSlice";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import apiService from "@/services/api";
import FicheComments from "@/components/fiche/FicheComments";
import ReportDialog from "@/components/fiche/ReportDialog";
import SimilarTerms from "@/components/fiche/SimilarTerms";
import SharePopover from "@/components/SharePopover";
import LinkedContent from "@/components/shared/LinkedContent";
import LinkedContentWithUrls from "@/components/shared/LinkedContentWithUrls";
import { getAuthorBadge, getAuthorBadgeByTermsCount } from "@/lib/badges";
import LoginRequiredPopup from "@/components/ui/LoginRequiredPopup";
import useLoginRequired from "@/hooks/useLoginRequired";
import {
  User,
  Calendar,
  BookOpen,
  Share2,
  Flag,
  Edit,
  Pencil,
  Loader2,
  Heart,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

const Fiche = () => {
  const { slug } = useParams();
  const { user, hasAuthorPermissions } = useAuth();
  const dispatch = useDispatch();
  const terms = useSelector(selectAllTerms);
  const dataLoading = useSelector((state) => state.terms.loading);
  const knownUsersList = useSelector(selectAllUsers);
  const usersLoading = useSelector((state) => state.users.loading);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { requireAuth, isPopupOpen, closePopup, popupConfig } =
    useLoginRequired();
  const [term, setTerm] = useState(null);
  const [author, setAuthor] = useState(null);
  const [similarTerms, setSimilarTerms] = useState([]);
  const [similarTermsTitle, setSimilarTermsTitle] =
    useState("Termes Similaires");
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  // Removed 'Voir aussi' feature: no separate see-also parsing/state

  useEffect(() => {
    if (!usersLoading && (!knownUsersList || knownUsersList.length === 0)) {
      dispatch(fetchUsers());
    }
  }, [dispatch, usersLoading, knownUsersList]);

  const computeDisplayName = useCallback((entity) => {
    if (!entity || typeof entity !== "object") return null;

    const directName = [entity.name, entity.displayName, entity.fullName]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .find((value) => value);
    if (directName) return directName;

    const first = entity.firstname || entity.firstName || entity.prenom || "";
    const last = entity.lastname || entity.lastName || entity.nom || "";
    const composed = [first, last]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean)
      .join(" ");
    if (composed) return composed;

    if (typeof entity.username === "string" && entity.username.trim()) {
      return entity.username.trim();
    }

    const email = entity.email || entity.mail;
    if (typeof email === "string" && email.trim()) {
      return email.trim();
    }

    return null;
  }, []);

  const computeEmail = useCallback((entity) => {
    if (!entity || typeof entity !== "object") return null;
    const email = entity.email || entity.mail;
    return typeof email === "string" && email.trim() ? email.trim() : null;
  }, []);

  // Load likes count and current user like state from backend
  useEffect(() => {
    const run = async () => {
      if (!term) return;
      try {
        const likeInfo = await apiService.getLikes(term.id);
        setLikes(Number(likeInfo?.count || 0));
      } catch (_) {
        setLikes(0);
      }
      if (user) {
        try {
          const me = await apiService.getMyLike(term.id);
          setIsLiked(Boolean(me?.likedByUser));
        } catch (_) {
          setIsLiked(false);
        }
      } else {
        setIsLiked(false);
      }
    };
    run();
  }, [term, user]);

  const resolveAuthorInfo = useCallback(
    (comment, localUsers = []) => {
      if (!comment) {
        return { name: "Utilisateur", email: null };
      }

      const storedName =
        typeof comment.authorName === "string" && comment.authorName.trim()
          ? comment.authorName.trim()
          : null;
      const storedEmail =
        typeof comment.authorEmail === "string" && comment.authorEmail.trim()
          ? comment.authorEmail.trim()
          : null;

      if (storedName) {
        return { name: storedName, email: storedEmail || null };
      }

      const normalizeId = (source) =>
        source !== undefined && source !== null ? String(source) : "";
      const targetId = normalizeId(comment.authorId);

      const matchFromRedux =
        knownUsersList?.find(
          (u) => normalizeId(u.id || u._id || u.userId || u.userID) === targetId
        ) || null;
      const matchFromLocal =
        localUsers?.find(
          (u) => normalizeId(u.id || u._id || u.userId || u.userID) === targetId
        ) || null;

      const candidate = matchFromRedux || matchFromLocal;
      if (candidate) {
        const candidateName = computeDisplayName(candidate);
        const candidateEmail = computeEmail(candidate);
        if (candidateName) {
          return { name: candidateName, email: candidateEmail };
        }
        if (candidateEmail) {
          return { name: candidateEmail, email: candidateEmail };
        }
      }

      if (storedEmail) {
        return { name: storedEmail, email: storedEmail };
      }

      return { name: "Utilisateur", email: null };
    },
    [computeDisplayName, computeEmail, knownUsersList]
  );

  // Utilities to compute similar terms based on definitions and "Voir aussi" content
  const STOP_WORDS = useMemo(
    () =>
      new Set([
        "le",
        "la",
        "les",
        "un",
        "une",
        "des",
        "du",
        "de",
        "d",
        "l",
        "en",
        "et",
        "ou",
        "au",
        "aux",
        "ce",
        "cet",
        "cette",
        "ces",
        "que",
        "qui",
        "quoi",
        "est",
        "sont",
        "pour",
        "par",
        "avec",
        "dans",
        "sur",
        "sous",
        "entre",
        "si",
        "se",
        "sa",
        "son",
        "ses",
        "leur",
        "leurs",
        "nos",
        "vos",
        "tes",
        "mes",
        "plus",
        "moins",
        "aussi",
        "comme",
        "ne",
        "pas",
        "tres",
        "très",
        "bien",
        "afin",
        "car",
        "donc",
        "ainsi",
        "cela",
        "vers",
        "chez",
      ]),
    []
  );

  const normalizeText = useCallback((s) => {
    return (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }, []);

  const tokenize = useCallback(
    (s) => {
      const txt = normalizeText(s).replace(/[^a-z0-9\s]/g, " ");
      const parts = txt
        .split(/\s+/)
        .filter((w) => w && w.length >= 3 && !STOP_WORDS.has(w));
      return new Set(parts);
    },
    [STOP_WORDS, normalizeText]
  );

  const loadData = useCallback(async () => {
    if (dataLoading) return;

    const currentTerm = terms.find((t) => t.slug === slug);

    if (currentTerm) {
      setTerm(currentTerm);

      // Resolve author from Redux users list (no localStorage)
      const termAuthor = (knownUsersList || []).find(
        (u) => String(u.id) === String(currentTerm.authorId)
      );
      setAuthor(termAuthor || null);

      try {
        const items = await apiService.getComments(currentTerm.id);
        setComments(Array.isArray(items) ? items : []);
      } catch (e) {
        setComments([]);
      }

      // Similar terms should also have the "Coaching" category
      let relatedTerms = terms.filter(
        (t) => t.category === "Coaching" && t.id !== currentTerm.id
      );

      if (relatedTerms.length > 0) {
        setSimilarTermsTitle("Termes Similaires");
        setSimilarTerms(relatedTerms.slice(0, 5));
      } else if (terms.length > 1) {
        setSimilarTermsTitle("Découvrez aussi");
        const defaultTerms = terms
          .filter((t) => t.id !== currentTerm.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 5);
        setSimilarTerms(defaultTerms);
      } else {
        setSimilarTerms([]);
      }

      // Content-based suggestions overriding the generic fallback when available
      try {
        const defText = currentTerm.definition || "";
        const sourcesText = (currentTerm.sources || [])
          .map((s) => (s && s.text) || "")
          .join("\n");
        const remarkText = (currentTerm.remarques || [])
          .map((r) => (r && r.text) || "")
          .join("\n");
        const baseKeywords = tokenize(
          `${currentTerm.term || ""} ${defText} ${sourcesText} ${remarkText}`
        );
        const sourcesNormalized = normalizeText(sourcesText);

        const candidates = (terms || []).filter(
          (t) => t && t.id !== currentTerm.id && t.status === "published"
        );

        const scored = candidates
          .map((t) => {
            const candidateTokens = new Set([
              ...tokenize(t.term || ""),
              ...tokenize(t.definition || ""),
            ]);
            let overlap = 0;
            candidateTokens.forEach((tok) => {
              if (baseKeywords.has(tok)) overlap += 1;
            });
            const termNorm = normalizeText(t.term || "");
            const direct =
              termNorm && sourcesNormalized.includes(termNorm) ? 1 : 0;
            const sameCategoryBoost =
              t.category === currentTerm.category ? 0.5 : 0;
            const score = overlap + (direct ? 5 : 0) + sameCategoryBoost;
            return { t, score, direct };
          })
          .filter((x) => x.score > 0)
          .sort(
            (a, b) => b.score - a.score || a.t.term.localeCompare(b.t.term)
          );

        if (scored.length > 0) {
          const top = scored.slice(0, 5).map((x) => x.t);
          // Always use "Termes Similaires" label
          const hasDirect = false;
          setSimilarTermsTitle("Termes Similaires");
          setSimilarTerms(top);
        }
      } catch (e) {
        // Keep fallback suggestions if any error occurs
      }
    }
    setLoading(false);
  }, [dataLoading, resolveAuthorInfo, slug, terms, knownUsersList]);

  useEffect(() => {
    if (!terms || terms.length === 0) {
      dispatch(fetchTerms({ limit: 10000 }));
    }
  }, [dispatch, terms]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (term && user) {
      // Fetch likes from database
      apiService
        .getLikes(term.id)
        .then((data) => {
          setLikes(data.count || 0);
          setIsLiked(data.isLiked || false);
        })
        .catch((error) => {
          console.error("Error fetching likes:", error);
          setLikes(0);
          setIsLiked(false);
        });
    }
  }, [term, user]);

  const handleLike = async () => {
    if (
      !requireAuth({
        action: "like",
        title: "Connexion requise",
        description: "Vous devez être connecté pour aimer un terme.",
      })
    ) {
      return;
    }

    try {
      const data = await apiService.toggleLike(term.id);
      setLikes(data.count || 0);
      setIsLiked(data.liked || false);

      toast({
        title: data.liked ? "Terme aimé" : "Like retiré",
        description: data.liked
          ? "Vous avez aimé ce terme ❤️"
          : "Vous n'aimez plus ce terme",
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le like. Réessayez plus tard.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;

    try {
      await apiService.deleteComment(commentId);
      setComments((prev) =>
        prev.filter((comment) => String(comment.id) !== String(commentId))
      );
      toast({
        title: "Commentaire supprime",
        description: "Le commentaire a ete supprime avec succes.",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le commentaire.",
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = async (contentOrPayload) => {
    try {
      await apiService.addComment(term.id, contentOrPayload);
      await loadData();
      toast({
        title: "Commentaire publié !",
        description: "Merci pour votre contribution.",
      });
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire.",
        variant: "destructive",
      });
    }
  };

  const handleReplySubmit = async (parentId, content) => {
    try {
      await apiService.addReply(term.id, parentId, content);
      await loadData();
      toast({ title: "Réponse publiée !" });
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la réponse.",
        variant: "destructive",
      });
    }
  };

  const handleReportSubmit = async (reason, details) => {
    if (
      !requireAuth({
        action: "report",
        title: "Connexion requise",
        description: "Vous devez être connecté pour signaler un terme.",
      })
    ) {
      return;
    }

    try {
      await dispatch(
        createReport({
          term_id: term.id,
          reason,
          details,
        })
      ).unwrap();

      setIsReportOpen(false);
      toast({
        title: "Signalement envoyé",
        description: "Merci, les modérateurs vont examiner ce terme.",
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du signalement:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible d'envoyer le signalement pour le moment. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const getAuthorName = useCallback(
    (authorId) => {
      const normalizedId =
        authorId !== undefined && authorId !== null ? String(authorId) : "";

      // If comments include a display name, prefer that
      const associatedComment = comments.find(
        (comment) =>
          (comment.authorId !== undefined &&
            comment.authorId !== null &&
            String(comment.authorId) === normalizedId) ||
          false
      );
      if (
        associatedComment &&
        typeof associatedComment.authorName === "string" &&
        associatedComment.authorName.trim()
      ) {
        return associatedComment.authorName.trim();
      }

      // Fall back to Redux users list
      const match = (knownUsersList || []).find(
        (u) => String(u.id) === normalizedId
      );
      if (match) {
        const name =
          [match.name, match.displayName, match.fullName]
            .map((v) => (typeof v === "string" ? v.trim() : ""))
            .find(Boolean) ||
          [match.firstname || match.firstName, match.lastname || match.lastName]
            .map((v) => (typeof v === "string" ? v.trim() : ""))
            .filter(Boolean)
            .join(" ");
        if (name) return name;
      }
      return "Mohamed Rachid Belhadj";
    },
    [comments, knownUsersList]
  );

  // Compute author badge values before any conditional returns to respect Hooks rules
  const authoredTermsCount = useMemo(() => {
    if (!author || !Array.isArray(terms)) return 0;
    const authorId = author.id ?? author.user_id ?? author.userId;
    return terms.filter(
      (t) => String(t.authorId ?? t.author_id) === String(authorId)
    ).length;
  }, [author, terms]);

  const authorBadge = useMemo(() => {
    if (!author) return null;
    const roleLc = String(author.role || "").toLowerCase();
    if (roleLc !== "author" && roleLc !== "admin") return null;
    const byCount = getAuthorBadgeByTermsCount(authoredTermsCount);
    return byCount || getAuthorBadge(author.termsCount || 0);
  }, [author, authoredTermsCount]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-32 w-32 animate-spin text-primary" />
      </div>
    );
  }

  if (!term) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold">404 - Terme non trouvé</h1>
        <p className="text-muted-foreground mt-4">
          Désolé, le terme que vous cherchez n'existe pas.
        </p>
        <Link to="/">
          <Button className="mt-8">Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  // Admin can edit all terms, Author can only edit their own terms
  const isAdmin = user && user.role === "admin";
  const isAuthor =
    user &&
    (typeof hasAuthorPermissions === "function"
      ? hasAuthorPermissions()
      : user.role === "author");
  const isOwner = user && String(term?.authorId) === String(user.id);
  const canEditDirectly = isAdmin || (isAuthor && isOwner);
  // Only logged-in users who cannot edit directly can propose modifications
  // This includes chercheur and authors viewing other author's terms
  const canProposeModification = user && !canEditDirectly;
  // authorBadge computed above

  return (
    <>
      <Helmet>
        <title>{term?.term ? `${term.term} - Dicoaching` : "Dicoaching"}</title>
        <meta
          name="description"
          content={
            term?.definition?.substring(0, 160) ||
            "Fiche de terme du Dictionnaire du Coaching"
          }
        />
      </Helmet>

      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto py-16"
        >
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20 text-sm py-1 px-3"
                  >
                    {term.category}
                  </Badge>
                </div>
                <div className="flex items-start gap-4 flex-wrap">
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                    {term.term}
                  </h1>
                  {canEditDirectly && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 flex items-center gap-2"
                      onClick={() => navigate(`/edit/${term.slug}`)}
                    >
                      <Edit className="h-4 w-4" /> Modifier
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <Button
                  onClick={handleLike}
                  variant={isLiked ? "default" : "outline"}
                  size="icon"
                  className="rounded-full transition-all duration-300 w-12 h-12 shadow-md"
                >
                  <Heart
                    className={`h-6 w-6 ${
                      isLiked ? "fill-current text-white" : "text-primary"
                    }`}
                  />
                </Button>
                <SharePopover url={window.location.href} title={term.term}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full w-12 h-12 shadow-md"
                  >
                    <Share2 className="h-6 w-6 text-primary" />
                  </Button>
                </SharePopover>
                {user && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full w-12 h-12 shadow-md text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setIsReportOpen(true)}
                  >
                    <Flag className="h-6 w-6" />
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
              {author && (
                <Link
                  to={`/author/${author.id}`}
                  className="flex items-center gap-2 hover:text-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={author.profilePicture} />
                    <AvatarFallback>
                      {(computeDisplayName(author) || "A").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {getAuthorName(term.authorId)}
                  </span>
                </Link>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Créé le {new Date(term.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{term.views || 0} vues</span>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span className="font-semibold">{likes}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto py-12">
        <div className="flex flex-col lg:flex-row lg:gap-12">
          <div className="flex-grow lg:w-2/3 space-y-8">
            <Card className="shadow-lg border-t-4 border-primary bg-card">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">
                  Définition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90">
                  <LinkedContent text={term.definition} />
                </div>
              </CardContent>
            </Card>

            {term.exemples && term.exemples.length > 0 && (
              <Card className="shadow-lg border-t-4 border-blue-500 bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-500">
                    Exemples
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {term.exemples.map((ex, i) => (
                    <div
                      key={i}
                      className="border-l-4 border-blue-400 pl-4 py-2 bg-muted/50 rounded-r-md"
                    >
                      <p className="italic text-muted-foreground">
                        "<LinkedContent text={ex.text} />"
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {term.sources && term.sources.length > 0 && (
              <Card className="shadow-lg border-t-4 border-green-500 bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-green-500 flex items-center gap-2">
                    <BookOpen className="h-6 w-6" /> Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {term.sources.map((src, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-md hover:bg-muted/70 transition-colors"
                    >
                      <BookOpen className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                      <div className="text-sm font-medium text-foreground">
                        <LinkedContentWithUrls text={src.text} />
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 ml-2"
                          >
                            <ExternalLink className="h-3 w-3" /> Lien
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {term.voirAussi && term.voirAussi.length > 0 && (
              <Card className="shadow-lg border-t-4 border-purple-500 bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-purple-500 flex items-center gap-2">
                    <BookOpen className="h-6 w-6" />
                    Voir aussi
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cliquez sur les termes soulignés pour découvrir les concepts
                    liés, ou sur les liens pour accéder aux ressources externes
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {term.voirAussi.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-md hover:bg-muted/70 transition-colors"
                    >
                      <BookOpen className="h-5 w-5 text-purple-500 flex-shrink-0 mt-1" />
                      <div className="text-sm font-medium text-foreground">
                        <LinkedContentWithUrls text={item.text} />
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 ml-2"
                          >
                            <ExternalLink className="h-3 w-3" /> Lien
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {((term.remarques && term.remarques.length > 0) ||
              (term.remarque && String(term.remarque).trim() !== "")) && (
              <Card className="shadow-lg border-t-4 border-amber-500 bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-amber-500">
                    Remarques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(term.remarques && term.remarques.length > 0
                    ? term.remarques
                    : [{ text: term.remarque }]
                  ).map((rmq, i) => (
                    <div
                      key={i}
                      className="border-l-4 border-amber-400 pl-4 py-2 bg-muted/50 rounded-r-md"
                    >
                      <p className="text-sm text-muted-foreground">
                        <LinkedContent text={rmq.text} />
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <FicheComments
              comments={comments}
              onCommentSubmit={handleCommentSubmit}
              onReplySubmit={handleReplySubmit}
              onDeleteComment={handleDeleteComment}
              getAuthorName={getAuthorName}
            />
          </div>

          <aside className="lg:w-1/3 space-y-6 mt-8 lg:mt-0 sticky top-24 h-fit">
            {user && (
              <Card className="p-4 shadow-lg border-border/50 bg-card">
                <CardTitle className="text-lg mb-4">Actions</CardTitle>
                <div className="space-y-2">
                  {canEditDirectly ? (
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/edit/${term.slug}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Modifier ce terme
                    </Button>
                  ) : canProposeModification ? (
                    <Link
                      to={`/propose-modification/${term.slug}`}
                      className="w-full"
                    >
                      <Button variant="secondary" className="w-full">
                        <Pencil className="h-4 w-4 mr-2" /> Proposer une
                        modification
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </Card>
            )}

            {author && (
              <Card className="shadow-lg border-border/50 bg-card">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Link to={`/author/${author.id}`}>
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={author.profilePicture}
                          alt={
                            computeDisplayName(author) ||
                            "Mohamed Rachid Belhadj"
                          }
                        />
                        <AvatarFallback>
                          {(computeDisplayName(author) || "M").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link to={`/author/${author.id}`}>
                        <CardTitle>
                          {computeDisplayName(author) ||
                            "Mohamed Rachid Belhadj"}
                        </CardTitle>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {author.professionalStatus}
                      </p>
                      {authorBadge && (
                        <Badge variant={authorBadge.variant} className="mt-2">
                          {React.cloneElement(authorBadge.icon, {
                            className: "h-3 w-3 mr-1",
                          })}
                          {authorBadge.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            <SimilarTerms terms={similarTerms} title={similarTermsTitle} />
          </aside>
        </div>
        <ReportDialog
          isOpen={isReportOpen}
          onOpenChange={setIsReportOpen}
          onSubmit={handleReportSubmit}
        />
        <LoginRequiredPopup
          isOpen={isPopupOpen}
          onOpenChange={closePopup}
          action={popupConfig.action}
          title={popupConfig.title}
          description={popupConfig.description}
        />
      </div>
    </>
  );
};

export default Fiche;
