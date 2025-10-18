import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from "react-helmet-async";
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import authService from "@/services/authService";
import { getProfilePictureUrl } from "@/lib/avatarUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Upload,
  Save,
  Lock,
  Trash2,
  Plus,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Link as LinkIcon,
  Camera,
  BadgeInfo,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddDocumentDialog from "@/components/profile/AddDocumentDialog";
import { Badge } from "@/components/ui/badge";
import DocumentViewerDialog from "@/components/DocumentViewerDialog";
import apiService from "@/services/api";
import { buildUploadUrl } from "@/lib/url";

const professionalStatuses = [
  "Étudiant",
  "Enseignant / Professeur",
  "Coach / Formateur",
  "Chercheur",
  "Professionnel RH",
  "Autre",
];

const genderOptions = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
];

const parseSocialArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") {
        return Object.keys(parsed)
          .map((k) => ({ network: k, url: parsed[k] }))
          .filter((e) => e.network && e.url);
      }
      return [];
    } catch (error) {
      return [];
    }
  }
  if (typeof value === "object") {
    return Object.keys(value)
      .map((k) => ({ network: k, url: value[k] }))
      .filter((e) => e.network && e.url);
  }
  return [];
};

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

const ChangePasswordDialog = ({ userId, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // TODO: Implement password change API endpoint
      // For now, keep the localStorage approach until backend endpoint is ready
      const allUsers = JSON.parse(
        localStorage.getItem("coaching_dict_users") || "[]"
      );
      const userIndex = allUsers.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        setError("Utilisateur non trouvé.");
        return;
      }

      if (allUsers[userIndex].password !== currentPassword) {
        setError("Le mot de passe actuel est incorrect.");
        return;
      }

      allUsers[userIndex].password = newPassword;
      localStorage.setItem("coaching_dict_users", JSON.stringify(allUsers));

      setError("");
      onPasswordChanged();
      setIsDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError("Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Lock className="mr-2 h-4 w-4" /> Changer le mot de passe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>
            Entrez votre mot de passe actuel et le nouveau mot de passe.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentPassword" className="text-right">
              Actuel
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newPassword" className="text-right">
              Nouveau
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmPassword" className="text-right">
              Confirmer
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="col-span-3"
            />
          </div>
          {error && (
            <p className="col-span-4 text-center text-red-500 text-sm">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsDialogOpen(false)}
          >
            Annuler
          </Button>
          <Button type="submit" onClick={handleChangePassword}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function MyProfile() {
  const { user, updateUser, hasAuthorPermissions } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [userDocs, setUserDocs] = useState([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          // Get the current user data from the auth context
          const userData = {
            id: user.id,
            email: user.email || "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            phone: user.phone || "",
            birth_date: user.birth_date
              ? String(user.birth_date).slice(0, 10)
              : "",
            sex: user.sex || "",
            role: user.role,
            biography: user.biography || "",
            professional_status: user.professional_status || "",
            other_status: user.other_status || "",
            profile_picture: user.profile_picture || "",
            profile_picture_url: user.profile_picture_url || "",
            presentation: user.presentation || "",
            socials: parseSocialArray(user.socials),
            documents: [], // Documents functionality to be implemented later
            profilePictureFile: null,
            profilePicturePreview: null,
          };

          setFormData(userData);
        } catch (error) {
          console.error("Erreur lors du chargement du profil:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les données du profil",
            variant: "destructive",
          });
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
    // fetch persisted documents from backend
    const fetchUserDocuments = async () => {
      if (!user || !user.id) return;
      try {
        const res = await apiService.get(`/api/documents/user/${user.id}`);
        const docs = (res && res.data) || res || [];
        const normalized = Array.isArray(docs)
          ? docs.map((d) => ({
              id: d.id,
              title: d.original_filename || d.filename || `document-${d.id}`,
              url:
                d.url ||
                (d.filename
                  ? buildUploadUrl(`/uploads/documents/${d.filename}`)
                  : null),
              downloadUrl:
                d.downloadUrl ||
                (d.id ? `/api/documents/download/${d.id}` : null),
              mime: d.mime_type || d.mimeType || null,
              purpose: d.purpose || null,
              status: d.status || null,
            }))
          : [];
        setUserDocs(normalized);
      } catch (err) {
        console.error("Error fetching user documents for profile:", err);
      }
    };

    fetchUserDocuments();
  }, [user, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "La taille du fichier ne doit pas dépasser 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erreur",
          description: "Seules les images sont autorisées",
          variant: "destructive",
        });
        return;
      }

      // Store file for upload and create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profilePictureFile: file,
          profilePicturePreview: reader.result,
          profile_picture_url: null,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialChange = (index, field, value) => {
    const newSocials = [...formData.socials];
    newSocials[index][field] = value;
    setFormData((prev) => ({ ...prev, socials: newSocials }));
  };

  const FIXED_NETWORKS = ["facebook", "instagram", "linkedin", "x"];

  const getFixedSocialUrl = (key) => {
    const entry = (formData.socials || []).find(
      (s) => (s.network || "").toLowerCase() === key
    );
    return entry?.url || "";
  };

  const setFixedSocialUrl = (key, url) => {
    const socials = [...(formData.socials || [])];
    const idx = socials.findIndex(
      (s) => (s.network || "").toLowerCase() === key
    );
    const trimmed = (url || "").trim();
    if (!trimmed) {
      // remove existing entry if clearing
      if (idx >= 0) socials.splice(idx, 1);
    } else if (idx >= 0) {
      socials[idx] = { ...socials[idx], network: key, url: trimmed };
    } else {
      socials.push({ network: key, url: trimmed });
    }
    setFormData((prev) => ({ ...prev, socials }));
  };

  const addSocialField = () => {
    setFormData((prev) => ({
      ...prev,
      socials: [...prev.socials, { network: "", url: "" }],
    }));
  };

  const removeSocialField = (index) => {
    const newSocials = [...formData.socials];
    newSocials.splice(index, 1);
    setFormData((prev) => ({ ...prev, socials: newSocials }));
  };

  const handleAddDocument = (newDoc) => {
    // newDoc can be a single doc object, an array of uploaded documents, or client-only doc
    const docsToAdd = Array.isArray(newDoc) ? newDoc : [newDoc];
    const normalized = docsToAdd.map((d) => ({
      title:
        d.original_filename ||
        d.filename ||
        d.title ||
        d.name ||
        d.label ||
        "Document",
      url: d.url || d.file || d.downloadUrl || d.url || null,
      downloadUrl:
        d.downloadUrl || (d.id ? `/api/documents/download/${d.id}` : null),
      id: d.id || null,
      _raw: d,
    }));

    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), ...normalized],
    }));

    // also merge into userDocs (persisted list) if the uploaded items came from server
    setUserDocs((prev) => [...(prev || []), ...normalized]);
  };

  const handleRemoveDocument = (index) => {
    const newDocuments = [...formData.documents];
    newDocuments.splice(index, 1);
    setFormData((prev) => ({ ...prev, documents: newDocuments }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData || !user) {
      return;
    }

    setSaving(true);

    try {
      if (!formData.firstname?.trim() || !formData.lastname?.trim()) {
        toast({
          title: "Nom et prénom requis",
          description:
            "Veuillez renseigner votre prénom et votre nom avant d'enregistrer.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const trimmedEmail = formData.email?.trim() || "";
      if (!trimmedEmail) {
        toast({
          title: "Email requis",
          description: "Votre adresse email ne peut pas être vide.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(trimmedEmail)) {
        toast({
          title: "Email invalide",
          description: "Veuillez saisir une adresse email valide.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const sanitizedSocials = Array.isArray(formData.socials)
        ? (() => {
            const toPairs = formData.socials
              .map((s) => ({
                network: (s.network || "").trim(),
                url: (s.url || "").trim(),
              }))
              .filter((s) => s.network && s.url);
            // normalize URLs (prepend https:// if missing scheme)
            const normalizeUrl = (u) => {
              if (!u) return u;
              const hasScheme = /^(https?:)?\/\//i.test(u);
              return hasScheme ? u : `https://${u.replace(/^\/*/, "")}`;
            };
            const map = new Map();
            for (const item of toPairs) {
              const key = item.network.toLowerCase();
              map.set(key, { network: key, url: normalizeUrl(item.url) });
            }
            return Array.from(map.values());
          })()
        : [];

      const profileData = {
        firstname: formData.firstname?.trim() || "",
        lastname: formData.lastname?.trim() || "",
        biography: formData.biography || "",
        professional_status: formData.professional_status || "",
        presentation: formData.presentation || "",
        socials: sanitizedSocials,
        email: trimmedEmail,
        phone: formData.phone ? formData.phone.trim() : "",
        sex: formData.sex || "",
        birth_date: formData.birth_date || "",
      };

      profileData.other_status =
        formData.professional_status === "Autre"
          ? formData.other_status?.trim() || ""
          : "";

      // Add profile picture file if it was changed
      if (formData.profilePictureFile) {
        profileData.profilePictureFile = formData.profilePictureFile;
      }

      const result = await authService.updateProfile(user.id, profileData);

      if (result.success) {
        const normalizedSocials = parseSocialArray(result.data.socials);

        const updatedData = {
          id: result.data.id,
          email: result.data.email || "",
          firstname: result.data.firstname || "",
          lastname: result.data.lastname || "",
          phone: result.data.phone || "",
          birth_date: result.data.birth_date
            ? String(result.data.birth_date).slice(0, 10)
            : "",
          sex: result.data.sex || "",
          role: result.data.role || formData.role,
          biography: result.data.biography || "",
          professional_status: result.data.professional_status || "",
          other_status: result.data.other_status || "",
          profile_picture:
            result.data.profile_picture || formData.profile_picture || "",
          profile_picture_url:
            result.data.profile_picture_url ||
            formData.profile_picture_url ||
            "",
          presentation: result.data.presentation || "",
          socials: normalizedSocials,
          documents: formData.documents || [],
          profilePictureFile: null,
          profilePicturePreview: result.data.profile_picture_url || null,
        };

        setFormData(updatedData);

        const contextUser = {
          ...result.data,
          socials: normalizedSocials,
        };

        updateUser(contextUser);

        toast({
          title: "Profil mis à jour !",
          description: "Vos informations ont été sauvegardées avec succès.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Erreur lors de la mise Ã  jour:", error);
      toast({
        title: "Erreur",
        description:
          error.message || "Impossible de sauvegarder les modifications",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChanged = () => {
    toast({
      title: "Mot de passe modifié !",
      description: "Votre mot de passe a été mis à jour avec succès.",
    });
  };

  if (loading || !formData) {
    return (
      <div className="text-center py-20">Chargement de votre profil...</div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {formData.firstname || formData.lastname
            ? `Mon Profil - ${formData.firstname} ${formData.lastname}`
            : "Mon Profil"}{" "}
          - Dictionnaire Collaboratif
        </title>
        <meta
          name="description"
          content="Gérez vos informations de profil, votre biographie et vos contributions."
        />
      </Helmet>
      <div className="min-h-screen creative-bg py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-8">
              Mon Profil
            </h1>
            <form onSubmit={handleSubmit}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Mettez à jour vos informations de base.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={
                            formData.profilePicturePreview ||
                            getProfilePictureUrl(formData)
                          }
                          alt={`${formData.firstname} ${formData.lastname}`}
                        />
                        <AvatarFallback>
                          <User className="h-12 w-12" />
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera className="h-8 w-8 text-white" />
                      </button>
                      <Input
                        id="profile-picture-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Photo de profil</Label>
                      <p className="text-sm text-muted-foreground">
                        Cliquez sur l'image pour la changer. Max 5MB.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstname">Prénom</Label>
                      <Input
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastname">Nom</Label>
                      <Input
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birth_date">Date de naissance</Label>
                      <Input
                        id="birth_date"
                        name="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="sex">Sexe</Label>
                      <Select
                        value={formData.sex || undefined}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, sex: value }))
                        }
                      >
                        <SelectTrigger id="sex">
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="professional_status">
                        Statut professionnel
                      </Label>
                      <Select
                        value={formData.professional_status || undefined}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            professional_status: value,
                            other_status:
                              value === "Autre" ? prev.other_status : "",
                          }))
                        }
                      >
                        <SelectTrigger id="professional_status">
                          <SelectValue placeholder="Sélectionnez votre statut" />
                        </SelectTrigger>
                        <SelectContent>
                          {professionalStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formData.professional_status === "Autre" && (
                    <div>
                      <Label htmlFor="other_status">
                        Précisez votre statut
                      </Label>
                      <Input
                        id="other_status"
                        name="other_status"
                        value={formData.other_status}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="presentation">Présentation</Label>
                    <Textarea
                      id="presentation"
                      name="presentation"
                      value={formData.presentation}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Vos motivations, vos centres d'intérêt..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <BadgeInfo className="h-5 w-5 text-primary" />
                      <Badge
                        variant="secondary"
                        className="text-base capitalize"
                      >
                        {formData.role}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="biography">Biographie</Label>
                    <Textarea
                      id="biography"
                      name="biography"
                      value={formData.biography}
                      onChange={handleInputChange}
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Réseaux sociaux</CardTitle>
                  <CardDescription>
                    Ajoutez les liens de vos profils. Laissez vide si non
                    applicable.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fixed popular networks */}
                  {[
                    { key: "facebook", label: "URL du profil Facebook" },
                    { key: "instagram", label: "URL du profil Instagram" },
                    { key: "linkedin", label: "URL du profil LinkedIn" },
                    { key: "x", label: "URL du profil X" },
                  ].map((n) => (
                    <div key={n.key} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-3 border rounded-md p-3">
                        <SocialIcon network={n.key} />
                        <Input
                          className="border-none focus-visible:ring-0"
                          placeholder={n.label}
                          value={getFixedSocialUrl(n.key)}
                          onChange={(e) =>
                            setFixedSocialUrl(n.key, e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}

                  {/* Extra/custom networks */}
                  {formData.socials
                    .map((s, i) => ({ s, i }))
                    .filter(
                      ({ s }) =>
                        !FIXED_NETWORKS.includes(
                          (s.network || "").toLowerCase()
                        )
                    )
                    .map(({ s, i }) => (
                      <div
                        key={`${i}-${s.network || "custom"}`}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-1 flex items-center gap-2 border rounded-md p-2">
                          <SocialIcon network={s.network || "link"} />
                          <Input
                            className="border-none focus-visible:ring-0 font-medium"
                            value={s.network}
                            placeholder="Nom du réseau"
                            onChange={(e) =>
                              handleSocialChange(i, "network", e.target.value)
                            }
                          />
                          <Input
                            className="border-none focus-visible:ring-0"
                            placeholder="URL du profil"
                            value={s.url}
                            onChange={(e) =>
                              handleSocialChange(i, "url", e.target.value)
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSocialField(i)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocialField}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Ajouter un autre réseau
                  </Button>
                </CardContent>
              </Card>

              {true && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      Gérez vos documents publics (certifications, etc.). Seuls
                      les PDF et images sont acceptés.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                      >
                        <p className="text-sm font-medium truncate">
                          {doc.title}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDocument(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <AddDocumentDialog
                      onAddDocument={handleAddDocument}
                      userId={user?.id}
                    />
                  </CardContent>
                </Card>
              )}

              {userDocs && userDocs.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Fichiers & Documents</CardTitle>
                    <CardDescription>
                      Documents associés à votre compte (uploadés et vérifiés).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {userDocs.map((d) => {
                        const isPreviewable =
                          d.url &&
                          /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(d.url);
                        const ext = (d.title || "")
                          .split(".")
                          .pop()
                          ?.toLowerCase();
                        return (
                          <div
                            key={d.id}
                            className="p-3 border rounded-md bg-muted/30 flex items-start gap-3"
                          >
                            <div className="h-10 w-10 flex items-center justify-center rounded bg-background border text-muted-foreground shrink-0">
                              {ext === "pdf" ? (
                                <span className="text-xs font-semibold">
                                  PDF
                                </span>
                              ) : (
                                <span className="text-xs font-semibold">
                                  FILE
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {d.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {d.purpose && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                                    {d.purpose}
                                  </span>
                                )}
                                {d.status && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">
                                    {d.status}
                                  </span>
                                )}
                                {d.mime && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                    {d.mime}
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
                                        url: d.url,
                                        title: d.title,
                                      });
                                      setIsViewerOpen(true);
                                    }}
                                  >
                                    Aperçu
                                  </Button>
                                )}
                                {d.url && (
                                  <a
                                    className="text-sm text-primary hover:underline"
                                    href={d.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Ouvrir
                                  </a>
                                )}
                                {d.downloadUrl && (
                                  <a
                                    className="text-sm text-primary hover:underline"
                                    href={d.downloadUrl}
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
                  </CardContent>
                </Card>
              )}

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>
                    Gérez les paramètres de sécurité de votre compte.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangePasswordDialog
                    userId={user.id}
                    onPasswordChanged={handlePasswordChanged}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default MyProfile;
