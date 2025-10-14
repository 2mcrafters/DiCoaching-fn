import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Info, Trash2 } from "lucide-react";
import { getProfilePictureUrl } from "@/lib/avatarUtils";

const FicheComments = ({
  comments,
  onCommentSubmit,
  onDeleteComment,
  getAuthorName,
}) => {
  const { user, hasAuthorPermissions } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");

  // Scroll to comment if URL has hash
  useEffect(() => {
    if (comments.length > 0 && window.location.hash) {
      const commentId = window.location.hash.replace("#comment-", "");
      const element = document.getElementById(`comment-${commentId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
          }, 2000);
        }, 500);
      }
    }
  }, [comments]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour commenter.",
        variant: "destructive",
      });
      return;
    }
    if (!newComment.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un commentaire.",
        variant: "destructive",
      });
      return;
    }
    onCommentSubmit(newComment);
    setNewComment("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Commentaires ({comments.length})
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-sm pt-2 text-muted-foreground bg-muted/30 p-2 rounded-md border border-input">
            <Info className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              Cet espace est dédié aux commentaires. Pour suggérer des
              changements, veuillez utiliser le bouton "Proposer une
              modification".
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Partagez votre expérience, posez une question ou apportez des précisions..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Publier
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground mb-2">
                Connectez-vous pour participer aux commentaires
              </p>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Se connecter
                </Button>
              </Link>
            </div>
          )}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun commentaire</h3>
                <p className="text-muted-foreground">
                  Soyez le premier à commenter cette fiche !
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const author = comment.author || {};
                const resolvedName =
                  (typeof author.name === "string" && author.name.trim()) ||
                  (typeof comment.authorName === "string" &&
                    comment.authorName.trim()) ||
                  (getAuthorName ? getAuthorName(comment.authorId) : null) ||
                  "Utilisateur";

                const avatarSrc = getProfilePictureUrl({
                  id: author.id || comment.authorId || "user",
                  sex: author.sex,
                  profile_picture: author.profile_picture,
                  profile_picture_url: author.profile_picture_url,
                });

                const initial = resolvedName
                  ? resolvedName.charAt(0).toUpperCase()
                  : "U";

                const canDelete =
                  user &&
                  (String(comment.authorId) === String(user.id) ||
                    user.role === "admin" ||
                    (typeof hasAuthorPermissions === "function" &&
                      hasAuthorPermissions()));

                const handleDelete = () => {
                  if (!onDeleteComment) return;
                  onDeleteComment(comment.id);
                };

                return (
                  <div
                    key={comment.id}
                    id={`comment-${comment.id}`}
                    className="border rounded-lg p-4 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={avatarSrc} alt={resolvedName} />
                          <AvatarFallback>{initial}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {resolvedName}
                            </span>
                            {author.role && (
                              <span className="text-[11px] uppercase tracking-wide text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                                {author.role}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground block">
                            {new Date(comment.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </div>
                      </div>
                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={handleDelete}
                          title="Supprimer le commentaire"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FicheComments;
