import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
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
} from "lucide-react";
import DocumentViewerDialog from "@/components/DocumentViewerDialog";

const SocialIcon = ({ network }) => {
  switch (network.toLowerCase()) {
    case "facebook":
      return <Facebook className="h-5 w-5 text-blue-600" />;
    case "instagram":
      return <Instagram className="h-5 w-5 text-pink-500" />;
    case "linkedin":
      return <Linkedin className="h-5 w-5 text-blue-700" />;
    case "x":
      return <Twitter className="h-5 w-5" />;
    default:
      return <LinkIcon className="h-5 w-5" />;
  }
};

const AuthorProfile = () => {
  const { authorId } = useParams();
  const author = useSelector((state) => selectUserById(state, authorId));
  const terms = useSelector(selectAllTerms);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Calcul stats et badge
  let stats = { termsAdded: 0, termsModified: 0 };
  let badge = null;
  if (author) {
    const authoredTerms = terms.filter(
      (t) => String(t.authorId) === String(authorId)
    );
    const forcedTermsCount =
      String(authorId) === "3" ? 1421 : authoredTerms.length;
    stats.termsAdded = forcedTermsCount;
    stats.termsModified = 0; // À calculer si tu as la logique
    const rawScore = Number(author.score);
    const computedScore =
      Number.isFinite(rawScore) && rawScore > 0
        ? rawScore
        : forcedTermsCount * 10;
    const badgeScore =
      String(authorId) === "3" ? Math.max(computedScore, 14210) : computedScore;
    badge = getAuthorBadge(badgeScore);
  }

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

  if (!author) {
    return <div className="text-center py-20">Auteur non trouvé.</div>;
  }

  return (
    <>
      <Helmet>
        <title>
          {author?.firstname || author?.lastname
            ? `Profil de ${author.firstname} ${author.lastname}`
            : author?.name
            ? `Profil de ${author.name}`
            : "Profil d'auteur"}{" "}
          - Dictionnaire Collaboratif
        </title>
        <meta
          name="description"
          content={`Découvrez le profil et les contributions de ${
            author.firstname && author.lastname
              ? `${author.firstname} ${author.lastname}`
              : author.name || "cet auteur"
          }.`}
        />
      </Helmet>
      <div className="min-h-screen creative-bg py-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden shadow-lg">
              <div className="creative-hero-bg h-32" />
              <CardContent className="p-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-5 -mt-20">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                    <AvatarImage
                      src={getProfilePictureUrl(author)}
                      alt={`${author.firstname || ""} ${author.lastname || ""}`}
                    />
                    <AvatarFallback>
                      <User className="h-16 w-16" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-4 sm:mt-0 flex-1">
                    <h1 className="text-3xl font-bold text-foreground">
                      {`${author.firstname || ""} ${
                        author.lastname || ""
                      }`.trim() ||
                        author.name ||
                        "Mohamed Rachid Belhadj"}
                    </h1>
                    <p className="text-md text-muted-foreground">
                      {author.professional_status ||
                        author.professionalStatus ||
                        ""}
                    </p>
                    {badge && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={badge.variant} className="text-sm">
                          {React.cloneElement(badge.icon, {
                            className: "h-3 w-3",
                          })}
                          <span className="ml-1">{badge.name}</span>
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <FileText className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-2xl font-bold mt-1">
                      {stats.termsAdded}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Termes ajoutés
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Edit className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-2xl font-bold mt-1">
                      {stats.termsModified}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Modifications
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <MessageSquare className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-2xl font-bold mt-1">0</p>
                    <p className="text-sm text-muted-foreground">
                      Commentaires
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-bold text-foreground">
                    Biographie
                  </h2>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                    {author.biography || "Aucune biographie fournie."}
                  </p>
                </div>

                {author.documents &&
                  Array.isArray(author.documents) &&
                  author.documents.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-bold text-foreground">
                        Documents
                      </h2>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {author.documents.map((doc, index) => (
                          <button
                            onClick={() => handleDocumentClick(doc)}
                            key={index}
                            className="block p-4 border rounded-lg hover:bg-muted/50 text-center cursor-pointer"
                          >
                            <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="mt-2 text-sm text-foreground truncate">
                              {doc.title || doc.originalName || doc.filename}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {author.socials &&
                  author.socials.filter((s) => s.url).length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-bold text-foreground">
                        Réseaux Sociaux
                      </h2>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {author.socials
                          .filter((s) => s.url)
                          .map((social, index) => (
                            <a
                              href={social.url}
                              key={index}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50"
                            >
                              <SocialIcon network={social.network} />
                              <span className="text-sm font-medium">
                                {social.customNetwork || social.network}
                              </span>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <DocumentViewerDialog
        isOpen={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        document={selectedDoc}
      />
    </>
  );
};

export default AuthorProfile;