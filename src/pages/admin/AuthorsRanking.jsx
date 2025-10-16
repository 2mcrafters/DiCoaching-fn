import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { selectAllUsers } from "@/features/users/usersSlice";
import { selectAllTerms } from "@/features/terms/termsSlice";
import {
  Download,
  Search,
  ArrowUpDown,
  Shield,
  Star,
  Gem,
  Crown,
  User,
  Mail,
  Calendar,
  Award,
  FileText,
  Activity,
  Phone,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Link as LinkIcon,
} from "lucide-react";

// Badge calculation based on terms count (not score)
const getAuthorBadgeByTermsCount = (termsCount) => {
  if (termsCount >= 50) {
    return {
      name: "Expert",
      icon: <Crown className="h-3 w-3" />,
      variant: "destructive",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      threshold: "50+ termes",
    };
  }
  if (termsCount >= 20 && termsCount <= 50) {
    return {
      name: "Or",
      icon: <Gem className="h-3 w-3" />,
      variant: "default",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      threshold: "20-50 termes",
    };
  }
  if (termsCount >= 5 && termsCount < 20) {
    return {
      name: "Argent",
      icon: <Star className="h-3 w-3" />,
      variant: "secondary",
      bgColor: "bg-gray-200",
      textColor: "text-gray-800",
      threshold: "5-19 termes",
    };
  }
  return {
    name: "Bronze",
    icon: <Shield className="h-3 w-3" />,
    variant: "outline",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    threshold: "0-4 termes",
  };
};

const AuthorsRanking = () => {
  const [authors, setAuthors] = useState([]);
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "termsAdded",
    direction: "desc",
  });
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get data from Redux store
  const allUsers = useSelector(selectAllUsers);
  const allTerms = useSelector(selectAllTerms);

  const handleAuthorClick = (author) => {
    setSelectedAuthor(author);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    // Filter only authors and admins
    const authorUsers = allUsers.filter((user) =>
      ["author", "admin", "researcher"].includes(
        (user.role || "").toLowerCase()
      )
    );

    // Calculate stats for each author from database terms
    const authorsWithStats = authorUsers.map((author) => {
      // Count terms created by this author
      const termsAdded = allTerms.filter(
        (term) => term.authorId === author.id || term.author_id === author.id
      ).length;

      // Get badge based on terms count (not score)
      const badge = getAuthorBadgeByTermsCount(termsAdded);

      // Build full name from database columns
      const fullName =
        author.name ||
        (author.firstname && author.lastname
          ? `${author.firstname} ${author.lastname}`.trim()
          : null) ||
        (author.firstName && author.lastName
          ? `${author.firstName} ${author.lastName}`.trim()
          : null) ||
        author.email;

      return {
        ...author,
        fullName, // Add computed full name
        termsAdded,
        termsModified: 0, // TODO: Track modifications in future
        badge,
        lastActivity:
          author.updatedAt || author.createdAt || new Date().toISOString(),
      };
    });

    // Sort by terms count by default
    authorsWithStats.sort((a, b) => b.termsAdded - a.termsAdded);

    setAuthors(authorsWithStats);
  }, [allUsers, allTerms]);

  useEffect(() => {
    let result = [...authors];

    if (searchQuery) {
      result = result.filter((author) =>
        author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredAuthors(result);
  }, [searchQuery, authors, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const exportToCSV = () => {
    const headers = [
      "Auteur",
      "Badge",
      "Termes Ajoutés",
      "Seuil Badge",
      "Termes Modifiés",
      "Dernière Activité",
    ];
    const rows = filteredAuthors.map((author) => [
      author.fullName,
      author.badge.name,
      author.termsAdded,
      author.badge.threshold,
      author.termsModified,
      new Date(author.lastActivity).toLocaleDateString("fr-FR"),
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "classement_auteurs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Helmet>
        <title>Classement des Auteurs - Administration</title>
        <meta
          name="description"
          content="Classement et statistiques des auteurs du dictionnaire."
        />
      </Helmet>
      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Classement des Auteurs
            </h1>
            <p className="text-muted-foreground">
              Suivez les performances et contributions des auteurs.
            </p>
          </motion.div>

          {/* Badge Legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Règles des Badges
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-red-100 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                    <Crown className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-bold text-red-800 dark:text-red-400">
                        Expert
                      </div>
                      <div className="text-red-600 dark:text-red-500">
                        50+ termes
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-950/30 px-3 py-2 rounded-lg">
                    <Gem className="h-4 w-4 text-yellow-600" />
                    <div>
                      <div className="font-bold text-yellow-800 dark:text-yellow-400">
                        Or
                      </div>
                      <div className="text-yellow-600 dark:text-yellow-500">
                        20-50 termes
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 px-3 py-2 rounded-lg">
                    <Star className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="font-bold text-gray-800 dark:text-gray-300">
                        Argent
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        5-19 termes
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-950/30 px-3 py-2 rounded-lg">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-bold text-orange-800 dark:text-orange-400">
                        Bronze
                      </div>
                      <div className="text-orange-600 dark:text-orange-500">
                        0-4 termes
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <CardTitle>Auteurs Actifs</CardTitle>
                    <CardDescription>
                      Liste de tous les auteurs avec leurs statistiques.
                    </CardDescription>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un auteur..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={exportToCSV} variant="outline">
                      <Download className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 cursor-pointer"
                          onClick={() => requestSort("name")}
                        >
                          <div className="flex items-center">
                            Auteur {getSortIcon("name")}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3">
                          <div className="flex items-center">Badge</div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 cursor-pointer"
                          onClick={() => requestSort("termsAdded")}
                        >
                          <div className="flex items-center">
                            Termes Ajoutés {getSortIcon("termsAdded")}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3">
                          <div className="flex items-center">Seuil Badge</div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 cursor-pointer"
                          onClick={() => requestSort("lastActivity")}
                        >
                          <div className="flex items-center">
                            Dernière Activité {getSortIcon("lastActivity")}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuthors.map((author) => (
                        <tr
                          key={author.id}
                          className="bg-background border-b hover:bg-muted/50"
                        >
                          <td className="px-6 py-4 font-medium text-foreground">
                            <button
                              onClick={() => handleAuthorClick(author)}
                              className="text-primary hover:text-primary/80 hover:underline font-semibold flex items-center gap-2 transition-colors"
                            >
                              <User className="h-4 w-4" />
                              {author.fullName}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${author.badge.bgColor} ${author.badge.textColor}`}
                            >
                              {author.badge.icon} {author.badge.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-lg">
                            {author.termsAdded}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {author.badge.threshold}
                          </td>
                          <td className="px-6 py-4">
                            {new Date(author.lastActivity).toLocaleDateString(
                              "fr-FR"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAuthors.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    Aucun auteur trouvé.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Author Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              {selectedAuthor?.fullName}
            </DialogTitle>
            <DialogDescription>
              Informations détaillées de l'auteur
            </DialogDescription>
          </DialogHeader>

          {selectedAuthor && (
            <div className="space-y-6 mt-4">
              {/* Badge Section */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedAuthor.badge.icon}</div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Badge Actuel
                    </div>
                    <div className="text-lg font-bold">
                      {selectedAuthor.badge.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedAuthor.badge.threshold}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Termes Ajoutés
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {selectedAuthor.termsAdded}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations Personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nom Complet
                      </div>
                      <div className="font-medium">
                        {selectedAuthor.fullName || "Non renseigné"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      <div className="font-medium break-all">
                        {selectedAuthor.email || "Non renseigné"}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Prénom
                      </div>
                      <div className="font-medium">
                        {selectedAuthor.firstname ||
                          selectedAuthor.firstName ||
                          "Non renseigné"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nom
                      </div>
                      <div className="font-medium">
                        {selectedAuthor.lastname ||
                          selectedAuthor.lastName ||
                          "Non renseigné"}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Rôle
                      </div>
                      <div className="font-medium">
                        <Badge
                          variant={
                            selectedAuthor.role === "admin"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {selectedAuthor.role || "User"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Statut
                      </div>
                      <div className="font-medium">
                        <Badge
                          variant={
                            selectedAuthor.status === "approved"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedAuthor.status || "pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  {selectedAuthor.phone && (
                    <div className="pt-3 border-t">
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </div>
                      <a
                        href={`tel:${selectedAuthor.phone}`}
                        className="font-medium text-primary hover:underline flex items-center gap-2"
                      >
                        {selectedAuthor.phone}
                      </a>
                    </div>
                  )}

                  {/* Social Links */}
                  {(() => {
                    let socials = [];
                    try {
                      if (selectedAuthor.socials) {
                        socials =
                          typeof selectedAuthor.socials === "string"
                            ? JSON.parse(selectedAuthor.socials)
                            : selectedAuthor.socials;
                      }
                    } catch (e) {
                      console.error("Error parsing socials:", e);
                    }

                    const hasSocials =
                      socials && Array.isArray(socials) && socials.length > 0;

                    if (hasSocials) {
                      return (
                        <div className="pt-3 border-t">
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                            <Globe className="h-4 w-4" />
                            Réseaux Sociaux
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {socials.map((social, index) => {
                              if (!social.url) return null;

                              // Determine icon based on platform
                              let Icon = LinkIcon;
                              let label = social.platform || "Lien";
                              let colorClass = "text-primary";

                              const url = social.url.toLowerCase();
                              if (url.includes("linkedin")) {
                                Icon = Linkedin;
                                label = "LinkedIn";
                                colorClass =
                                  "text-blue-600 hover:text-blue-700";
                              } else if (
                                url.includes("twitter") ||
                                url.includes("x.com")
                              ) {
                                Icon = Twitter;
                                label = "Twitter/X";
                                colorClass = "text-sky-500 hover:text-sky-600";
                              } else if (url.includes("facebook")) {
                                Icon = Facebook;
                                label = "Facebook";
                                colorClass =
                                  "text-blue-500 hover:text-blue-600";
                              } else if (url.includes("instagram")) {
                                Icon = Instagram;
                                label = "Instagram";
                                colorClass =
                                  "text-pink-600 hover:text-pink-700";
                              }

                              return (
                                <a
                                  key={index}
                                  href={social.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors ${colorClass}`}
                                  title={social.url}
                                >
                                  <Icon className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {label}
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Termes Ajoutés
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {selectedAuthor.termsAdded}
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Termes Modifiés
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedAuthor.termsModified || 0}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dernière Activité
                    </div>
                    <div className="font-medium">
                      {new Date(selectedAuthor.lastActivity).toLocaleDateString(
                        "fr-FR",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Membre Depuis
                    </div>
                    <div className="font-medium">
                      {selectedAuthor.createdAt
                        ? new Date(selectedAuthor.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "Non disponible"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badge Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Progression Badge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedAuthor.termsAdded < 5 && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            Prochain: Argent
                          </span>
                          <span className="font-semibold">
                            {5 - selectedAuthor.termsAdded} termes restants
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gray-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                (selectedAuthor.termsAdded / 5) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {selectedAuthor.termsAdded >= 5 &&
                      selectedAuthor.termsAdded < 20 && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              Prochain: Or
                            </span>
                            <span className="font-semibold">
                              {20 - selectedAuthor.termsAdded} termes restants
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${
                                  ((selectedAuthor.termsAdded - 5) / 15) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    {selectedAuthor.termsAdded >= 20 &&
                      selectedAuthor.termsAdded < 50 && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              Prochain: Expert
                            </span>
                            <span className="font-semibold">
                              {50 - selectedAuthor.termsAdded} termes restants
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${
                                  ((selectedAuthor.termsAdded - 20) / 30) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    {selectedAuthor.termsAdded >= 50 && (
                      <div className="text-center p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-lg">
                        <Crown className="h-12 w-12 mx-auto text-red-600 mb-2" />
                        <div className="font-bold text-lg">
                          Badge Maximum Atteint!
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Félicitations pour votre expertise!
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              {selectedAuthor.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {selectedAuthor.bio}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthorsRanking;