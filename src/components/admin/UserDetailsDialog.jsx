import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  User,
  Mail,
  Briefcase,
  Calendar,
  Link as LinkIcon,
  FileText,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import DocumentViewerDialog from "@/components/DocumentViewerDialog";
import { getProfilePictureUrl } from "@/lib/avatarUtils";
import apiService from "@/services/api";

const SocialIcon = ({ network }) => {
  switch (network.toLowerCase()) {
    case "facebook":
      return <Facebook className="h-5 w-5 text-blue-600" />;
    case "instagram":
      return <Instagram className="h-5 w-5 text-pink-500" />;
    case "linkedin":
      return <Linkedin className="h-5 w-5 text-blue-700" />;
    case "x":
    case "twitter":
      return <Twitter className="h-5 w-5" />;
    default:
      return <LinkIcon className="h-5 w-5" />;
  }
};

const UserDetailsDialog = ({ user }) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [open, setOpen] = useState(false);
  const [detailedUser, setDetailedUser] = useState(null);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Normalize fields to handle different API shapes
  const getDisplayName = (u) => {
    if (!u) return "Utilisateur";
    const name = u.name || u.displayName || u.fullName || null;
    if (name) return name;
    const first = u.firstname || u.first_name || u.firstName || "";
    const last = u.lastname || u.last_name || u.lastName || "";
    const composed = `${first} ${last}`.trim();
    if (composed) return composed;
    if (u.email) return u.email;
    return "Utilisateur";
  };

  // Prefer the fetched detailedUser when present, otherwise fall back to the list-provided `user`
  const effectiveUser = detailedUser || user;
  const displayName = getDisplayName(effectiveUser);
  // Normalize profile picture URL for correct rendering
  const profilePicture = getProfilePictureUrl(effectiveUser);
  const role = effectiveUser?.role || "user";
  const status = (
    effectiveUser?.status ||
    effectiveUser?.state ||
    ""
  ).toLowerCase();
  const createdAt =
    effectiveUser?.createdAt ||
    effectiveUser?.created_at ||
    effectiveUser?.registered_at ||
    null;
  const createdAtLabel = createdAt
    ? new Date(createdAt).toLocaleDateString("fr-FR")
    : "—";
  const professionalStatus =
    effectiveUser?.professionalStatus ||
    effectiveUser?.professional_status ||
    effectiveUser?.profession ||
    "";
  const biography =
    effectiveUser?.biography ||
    effectiveUser?.bio ||
    effectiveUser?.description ||
    "";
  const termsAdded =
    effectiveUser?.termsAdded ??
    effectiveUser?.terms_added ??
    effectiveUser?.termsCount ??
    effectiveUser?.terms_count ??
    0;
  const documents =
    effectiveUser?.documents ||
    effectiveUser?.docs ||
    effectiveUser?.files ||
    [];
  // Also accept other common fields where files might be stored
  const extraFiles =
    effectiveUser?.uploads ||
    effectiveUser?.user_files ||
    effectiveUser?.userFiles ||
    [];
  const fetchedDocs = effectiveUser?._fetchedDocuments || [];
  const allFilesRaw = []
    .concat(Array.isArray(documents) ? documents : [])
    .concat(Array.isArray(extraFiles) ? extraFiles : [])
    .concat(Array.isArray(fetchedDocs) ? fetchedDocs : []);
  // Normalize files: try to ensure each file has { url, title/name }
  const allFiles = (allFilesRaw || [])
    .map((f, idx) => {
      if (!f) return null;
      if (typeof f === "string") return { url: f, title: `fichier-${idx + 1}` };
      return {
        url: f.url || f.fileUrl || f.link || f.path || f.file || null,
        title:
          f.title ||
          f.name ||
          f.filename ||
          f.fileName ||
          f.label ||
          `fichier-${idx + 1}`,
        downloadUrl: f.downloadUrl || null,
        mime: f.mime || f.mime_type || f.mimeType || null,
        purpose: f.purpose || null,
        status: f.status || null,
        _raw: f,
      };
    })
    .filter(Boolean);
  const socialsRaw =
    effectiveUser?.socials ||
    effectiveUser?.social_links ||
    effectiveUser?.socialsList ||
    [];
  // Normalize socials to array of { network, url }
  const socials = Array.isArray(socialsRaw)
    ? socialsRaw
    : Object.keys(socialsRaw || {}).map((k) => ({
        network: k,
        url: socialsRaw[k],
      }));

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case "auteur":
        return <Badge className="bg-blue-100 text-blue-800">Auteur</Badge>;
      case "chercheur":
        return <Badge className="bg-green-100 text-green-800">Chercheur</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
        );
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDocumentClick = (doc) => {
    const docWithName = { ...doc, name: doc.title };
    const isSupported = /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(
      docWithName.name
    );
    if (isSupported) {
      setSelectedDoc(docWithName);
      setIsViewerOpen(true);
    } else {
      const link = document.createElement("a");
      link.href = docWithName.url;
      link.download = docWithName.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAvatarClick = () => {
    if (!profilePicture) return;
    // If profilePicture is a URL string, open it in the document viewer
    const doc = {
      url: profilePicture,
      title: `avatar-${user.id || "profile"}`,
    };
    setSelectedDoc(doc);
    setIsViewerOpen(true);
  };

  const downloadAsTxt = () => {
    const u = effectiveUser || user || {};
    const lines = [];
    lines.push(`Nom: ${getDisplayName(u)}`);
    lines.push(`Email: ${u.email || "—"}`);
    lines.push(`Rôle: ${u.role || "—"}`);
    lines.push(`Statut: ${u.status || u.state || "—"}`);
    lines.push(`Inscrit le: ${createdAtLabel}`);
    lines.push(`Profession: ${professionalStatus || "—"}`);
    lines.push("");
    lines.push("Biographie:");
    lines.push(u.biography || u.bio || u.description || "—");

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(u.name || u.email || "user")
      .toString()
      .replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  // Fetch extended user info and their terms when dialog opens
  useEffect(() => {
    const fetchDetails = async () => {
      if (!open) return;
      if (!user || !user.id) return;
      setLoadingDetail(true);
      try {
        const raw = await apiService.getUser(user.id);
        // api may return { data: user } or user object directly
        const u = raw && raw.data ? raw.data : raw || user;
        setDetailedUser(u);
      } catch (err) {
        console.error("Error fetching user details", err);
        setDetailedUser(user);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetails();
  }, [open, user]);

  // Fetch user's stored documents from backend and merge into allFiles when dialog opens
  useEffect(() => {
    const fetchUserDocs = async () => {
      if (!open) return;
      if (!user || !user.id) return;
      try {
        const res = await apiService.get(`/api/documents/user/${user.id}`);
        const docs = (res && res.data) || res || [];
        // Normalize and push into allFilesRaw-like structure
        if (Array.isArray(docs) && docs.length > 0) {
          const normalized = docs.map((d) => ({
            url:
              d.url ||
              (d.filename ? `/uploads/documents/${d.filename}` : null) ||
              d.file_path ||
              null,
            title: d.original_filename || d.filename || `document-${d.id}`,
            downloadUrl:
              d.downloadUrl ||
              (d.id ? `/api/documents/download/${d.id}` : null),
            mime: d.mime_type || d.mimeType || null,
            purpose: d.purpose || null,
            status: d.status || null,
          }));
          // merge into allFiles by appending to detailedUser (so UI picks them up via effectiveUser)
          setDetailedUser((prev) => {
            const copy = { ...(prev || user) };
            copy._fetchedDocuments = normalized;
            return copy;
          });
        }
      } catch (e) {
        console.error("Error fetching user documents:", e);
      }
    };

    fetchUserDocs();
  }, [open, user]);

  const downloadAllDocuments = () => {
    const docs =
      (detailedUser &&
        (detailedUser.documents ||
          detailedUser.docs ||
          detailedUser.files ||
          detailedUser.uploads)) ||
      allFiles ||
      [];
    docs.forEach((doc, idx) => {
      const url =
        (doc && (doc.url || doc.fileUrl || doc.link)) ||
        (typeof doc === "string" ? doc : null) ||
        (doc && doc.path) ||
        null;
      const name =
        (doc && (doc.title || doc.name || doc.filename)) ||
        `document-${idx + 1}`;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
            <DialogDescription>
              Informations complètes sur {displayName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleAvatarClick}
                className="rounded-full focus:outline-none"
                title="Aperçu de la photo de profil"
              >
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profilePicture} alt={displayName} />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
              </button>
              <div>
                <h3 className="text-xl font-semibold">{displayName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(role)}
                  {status && getStatusBadge(status)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Inscrit le: {createdAtLabel}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{professionalStatus || "—"}</span>
                </div>
                {effectiveUser?.phone && (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 text-muted-foreground">📞</span>
                    <span>{effectiveUser.phone}</span>
                  </div>
                )}
                {effectiveUser?.sex && (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 text-muted-foreground">⚧</span>
                    <span className="capitalize">{effectiveUser.sex}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Documents fournis: {allFiles.length}</span>
                </div>
                {effectiveUser?.birth_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{String(effectiveUser.birth_date).slice(0, 10)}</span>
                  </div>
                )}
              </div>
            </div>

            {biography && (
              <div>
                <h4 className="font-semibold mb-2">Biographie</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {biography}
                </p>
              </div>
            )}

            {effectiveUser?.presentation && (
              <div>
                <h4 className="font-semibold mb-2">Présentation</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {effectiveUser.presentation}
                </p>
              </div>
            )}

            {socials && socials.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Réseaux Sociaux</h4>
                <div className="space-y-2">
                  {socials.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <SocialIcon
                        network={
                          social.network ||
                          social.networkName ||
                          social.network_name ||
                          "link"
                        }
                      />
                      <strong className="uppercase text-xs">
                        {social.network ||
                          social.networkName ||
                          social.network_name ||
                          "Lien"}
                      </strong>
                      <span className="truncate">{social.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {allFiles && allFiles.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Fichiers & Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allFiles.map((f, idx) => {
                    const isPreviewable =
                      f.url && /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(f.url);
                    const ext = (f.title || "").split(".").pop()?.toLowerCase();
                    return (
                      <div
                        key={f.url || f.title || idx}
                        className="p-3 border rounded-md bg-muted/30 flex items-start gap-3"
                      >
                        <div className="h-9 w-9 flex items-center justify-center rounded bg-background border text-muted-foreground shrink-0">
                          {ext === "pdf" ? (
                            <span className="text-[10px] font-semibold">
                              PDF
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold">
                              FILE
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {f.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {f.purpose && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                                {f.purpose}
                              </span>
                            )}
                            {f.status && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">
                                {f.status}
                              </span>
                            )}
                            {f.mime && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                {f.mime}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {isPreviewable && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedDoc({
                                    url: f.url,
                                    title: f.title,
                                  });
                                  setIsViewerOpen(true);
                                }}
                              >
                                Aperçu
                              </Button>
                            )}
                            {f.url && (
                              <a
                                className="text-sm text-primary hover:underline"
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Ouvrir
                              </a>
                            )}
                            {f.downloadUrl && (
                              <a
                                className="text-sm text-primary hover:underline"
                                href={f.downloadUrl}
                              >
                                Télécharger
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {documents && documents.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Documents fournis</h4>
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <button
                      key={index}
                      onClick={() => handleDocumentClick(doc)}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      <span>
                        {doc.title || doc.name || `document-${index + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadAllDocuments}
                  >
                    Télécharger tous les documents
                  </Button>
                </div>
              </div>
            )}

            {loadingDetail && (
              <div className="text-sm text-muted-foreground">
                Chargement des détails...
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={downloadAsTxt}>
                  Télécharger TXT
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRaw((s) => !s)}
                >
                  {showRaw ? "Masquer TEXTE brut" : "Afficher TEXTE brut"}
                </Button>
              </div>
              {showRaw && (
                <div className="mt-2 max-h-48 overflow-auto text-sm bg-slate-50 p-3 rounded whitespace-pre-wrap">
                  {`Nom: ${getDisplayName(effectiveUser || user)}\nEmail: ${
                    (effectiveUser || user || {}).email || "—"
                  }\nRôle: ${
                    (effectiveUser || user || {}).role || "—"
                  }\nStatut: ${
                    (effectiveUser || user || {}).status ||
                    (effectiveUser || user || {}).state ||
                    "—"
                  }\nInscrit le: ${createdAtLabel}\n\nBiographie:\n${
                    (effectiveUser || user || {}).biography ||
                    (effectiveUser || user || {}).bio ||
                    (effectiveUser || user || {}).description ||
                    "—"
                  }`}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <DocumentViewerDialog
        isOpen={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        document={selectedDoc}
      />
    </>
  );
};

export default UserDetailsDialog;
