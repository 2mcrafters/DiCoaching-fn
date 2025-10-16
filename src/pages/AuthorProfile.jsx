import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import { motion } from 'framer-motion';
import { useSelector } from "react-redux";
import { selectUserById } from "@/features/users/usersSlice";
import { selectAllTerms } from "@/features/terms/termsSlice";
import { getProfilePictureUrl } from "@/lib/avatarUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthorBadge } from "@/lib/badges";
import {
  User,
  FileText,
  Edit,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Link as LinkIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  BookOpen,
  Crown,
  Gem,
  Star,
  Shield,
} from "lucide-react";
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

const AuthorProfile = () => {
  const { authorId } = useParams();
  const author = useSelector((state) => selectUserById(state, authorId));
  const terms = useSelector(selectAllTerms);

  // Calcul stats et badge
  let stats = { termsAdded: 0, termsModified: 0, comments: 0 };
  let badge = null;
  let badgeByTerms = null;

  if (author) {
    const authoredTerms = terms.filter(
      (t) => String(t.authorId) === String(authorId)
    );
    const forcedTermsCount =
      String(authorId) === "3" ? 1421 : authoredTerms.length;
    stats.termsAdded = forcedTermsCount;
    stats.termsModified = 0; // À calculer si tu as la logique
    stats.comments = 0; // À calculer depuis les commentaires

    // Badge calculation by terms count
    if (forcedTermsCount >= 50) {
      badgeByTerms = {
        name: "Expert",
        icon: Crown,
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      };
    } else if (forcedTermsCount >= 20) {
      badgeByTerms = {
        name: "Or",
        icon: Gem,
        color: "text-yellow-500",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      };
    } else if (forcedTermsCount >= 5) {
      badgeByTerms = {
        name: "Argent",
        icon: Star,
        color: "text-gray-400",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      };
    } else {
      badgeByTerms = {
        name: "Bronze",
        icon: Shield,
        color: "text-orange-500",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      };
    }

    const rawScore = Number(author.score);
    const computedScore =
      Number.isFinite(rawScore) && rawScore > 0
        ? rawScore
        : forcedTermsCount * 10;
    const badgeScore =
      String(authorId) === "3" ? Math.max(computedScore, 14210) : computedScore;
    badge = getAuthorBadge(badgeScore);
  }

  // Get full name
  const fullName =
    author?.name ||
    (author?.firstname && author?.lastname
      ? `${author.firstname} ${author.lastname}`.trim()
      : null) ||
    (author?.firstName && author?.lastName
      ? `${author.firstName} ${author.lastName}`.trim()
      : null) ||
    author?.email ||
    "Auteur";

  // Parse socials - handle multiple formats
  let socialLinks = [];
  try {
    if (author?.socials) {
      // If it's a string, try to parse it as JSON
      if (typeof author.socials === "string") {
        const trimmed = author.socials.trim();
        if (trimmed && trimmed !== "[]" && trimmed !== "{}") {
          socialLinks = JSON.parse(trimmed);
        }
      } else if (Array.isArray(author.socials)) {
        // If it's already an array, use it directly
        socialLinks = author.socials;
      } else if (
        typeof author.socials === "object" &&
        author.socials !== null
      ) {
        // If it's an object, try to convert to array
        socialLinks = Object.values(author.socials);
      }

      // Ensure it's an array and filter out invalid entries
      if (!Array.isArray(socialLinks)) {
        socialLinks = [];
      } else {
        socialLinks = socialLinks.filter(
          (s) => s && s.url && s.url.trim() !== ""
        );
      }
    }
  } catch (e) {
    console.error("Error parsing socials:", e, author?.socials);
    socialLinks = [];
  }

  if (!author) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Auteur non trouvé</h2>
          <p className="text-muted-foreground mb-4">
            L'auteur que vous recherchez n'existe pas.
          </p>
          <Link to="/authors">
            <Button>Voir tous les auteurs</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const BadgeIcon = badgeByTerms?.icon || Award;

  return (
    <>
      <Helmet>
        <title>{fullName} - Profil Auteur | Dictionnaire Collaboratif</title>
        <meta
          name="description"
          content={`Découvrez le profil et les contributions de ${fullName} sur le Dictionnaire Collaboratif.`}
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Header Section */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 pt-20 pb-40">
          <div className="absolute inset-0 bg-black/10"></div>
          <motion.div
            className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-2xl ring-4 ring-white/20">
                  <AvatarImage
                    src={getProfilePictureUrl(author)}
                    alt={fullName}
                  />
                  <AvatarFallback className="text-4xl bg-white text-blue-600">
                    {fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Name and Badge */}
              <div className="flex-1 text-center md:text-left">
                <motion.h1
                  className="text-4xl md:text-5xl font-bold text-white mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {fullName}
                </motion.h1>

                {author.professional_status && (
                  <motion.p
                    className="text-xl text-white/90 mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    {author.professional_status || author.professionalStatus}
                  </motion.p>
                )}

                <motion.div
                  className="flex items-center justify-center md:justify-start gap-3 flex-wrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  {badgeByTerms && (
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg`}
                    >
                      <BadgeIcon className={`h-5 w-5 ${badgeByTerms.color}`} />
                      <span className="font-semibold text-gray-900">
                        Badge {badgeByTerms.name}
                      </span>
                    </div>
                  )}

                  {author.role && (
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 bg-white/20 text-white border-white/30 text-sm"
                    >
                      {author.role === "admin"
                        ? "Administrateur"
                        : author.role === "chercheur"
                        ? "Chercheur"
                        : "Contributeur"}
                    </Badge>
                  )}

                  {author.status && (
                    <Badge
                      variant={
                        author.status === "active" ? "default" : "secondary"
                      }
                      className={`px-3 py-1 text-sm ${
                        author.status === "active"
                          ? "bg-green-500 text-white"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {author.status === "active"
                        ? "Actif"
                        : author.status === "pending"
                        ? "En attente"
                        : author.status}
                    </Badge>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-12">
          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="h-8 w-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{stats.termsAdded}</p>
                    <p className="text-sm opacity-90">Termes Ajoutés</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Edit className="h-8 w-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{stats.termsModified}</p>
                    <p className="text-sm opacity-90">Modifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="h-8 w-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{stats.comments}</p>
                    <p className="text-sm opacity-90">Commentaires</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Biography Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />À Propos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {author.biography ||
                        author.bio ||
                        "Aucune biographie disponible pour le moment."}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Activity & Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Statistiques d'Activité
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">Termes Contributés</p>
                            <p className="text-sm text-muted-foreground">
                              Total des contributions
                            </p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">
                          {stats.termsAdded}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium">Niveau Badge</p>
                            <p className="text-sm text-muted-foreground">
                              Basé sur les contributions
                            </p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-purple-600">
                          {badgeByTerms?.name || "Bronze"}
                        </span>
                      </div>

                      {author.created_at && (
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium">Membre Depuis</p>
                              <p className="text-sm text-muted-foreground">
                                Date d'inscription
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium">
                            {new Date(author.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Contact & Info */}
            <div className="space-y-6">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      Informations de Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {author.email && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">
                            Email
                          </p>
                          <a
                            href={`mailto:${author.email}`}
                            className="text-sm font-medium text-blue-600 hover:underline break-all"
                          >
                            {author.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {author.phone && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">
                            Téléphone
                          </p>
                          <a
                            href={`tel:${author.phone}`}
                            className="text-sm font-medium text-green-600 hover:underline"
                          >
                            {author.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {author.location && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">
                            Localisation
                          </p>
                          <p className="text-sm font-medium">
                            {author.location}
                          </p>
                        </div>
                      </div>
                    )}

                    {!author.email && !author.phone && !author.location && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune information de contact disponible.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Social Media */}
              {socialLinks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                >
                  <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900">
                    <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Réseaux Sociaux</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {socialLinks.map((social, index) => {
                          const url = social.url?.toLowerCase() || "";
                          let Icon = LinkIcon;
                          let colorClass = "text-gray-600 dark:text-gray-400";
                          let bgClass = "bg-gray-100 dark:bg-gray-800";
                          let hoverClass =
                            "hover:bg-gray-200 dark:hover:bg-gray-700";
                          let label = social.platform || "Lien Social";

                          if (url.includes("linkedin")) {
                            Icon = Linkedin;
                            colorClass = "text-blue-600 dark:text-blue-400";
                            bgClass = "bg-blue-100 dark:bg-blue-900/50";
                            hoverClass =
                              "hover:bg-blue-200 dark:hover:bg-blue-900";
                            label = "LinkedIn";
                          } else if (
                            url.includes("twitter") ||
                            url.includes("x.com")
                          ) {
                            Icon = Twitter;
                            colorClass = "text-sky-500 dark:text-sky-400";
                            bgClass = "bg-sky-100 dark:bg-sky-900/50";
                            hoverClass =
                              "hover:bg-sky-200 dark:hover:bg-sky-900";
                            label = url.includes("x.com")
                              ? "X (Twitter)"
                              : "Twitter";
                          } else if (url.includes("facebook")) {
                            Icon = Facebook;
                            colorClass = "text-blue-500 dark:text-blue-400";
                            bgClass = "bg-blue-100 dark:bg-blue-900/50";
                            hoverClass =
                              "hover:bg-blue-200 dark:hover:bg-blue-900";
                            label = "Facebook";
                          } else if (url.includes("instagram")) {
                            Icon = Instagram;
                            colorClass = "text-pink-600 dark:text-pink-400";
                            bgClass = "bg-pink-100 dark:bg-pink-900/50";
                            hoverClass =
                              "hover:bg-pink-200 dark:hover:bg-pink-900";
                            label = "Instagram";
                          }

                          return (
                            <a
                              key={index}
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-3 p-4 rounded-lg border ${hoverClass} transition-all group shadow-sm hover:shadow-md`}
                            >
                              <div
                                className={`p-3 ${bgClass} rounded-lg group-hover:scale-110 transition-transform`}
                              >
                                <Icon className={`h-5 w-5 ${colorClass}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                                  {label}
                                </p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {social.url}
                                </p>
                              </div>
                              <div className="text-muted-foreground group-hover:text-blue-600 transition-colors">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Personal Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Détails Personnels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {author.firstname && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">
                          Prénom
                        </span>
                        <span className="text-sm font-medium">
                          {author.firstname}
                        </span>
                      </div>
                    )}

                    {author.lastname && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">
                          Nom
                        </span>
                        <span className="text-sm font-medium">
                          {author.lastname}
                        </span>
                      </div>
                    )}

                    {author.role && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">
                          Rôle
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {author.role === "admin"
                            ? "Administrateur"
                            : author.role === "chercheur"
                            ? "Chercheur"
                            : "Contributeur"}
                        </Badge>
                      </div>
                    )}

                    {author.status && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">
                          Statut
                        </span>
                        <Badge
                          variant={
                            author.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {author.status === "active"
                            ? "Actif"
                            : author.status === "pending"
                            ? "En attente"
                            : author.status}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthorProfile;