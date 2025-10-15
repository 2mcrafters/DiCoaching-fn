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
import { MessageCircle, Send, Info, Trash2, Reply } from "lucide-react";
import { getProfilePictureUrl } from "@/lib/avatarUtils";

const FicheComments = ({
  comments,
  onCommentSubmit,
  onReplySubmit,
  onDeleteComment,
  getAuthorName,
}) => {
  const { user, hasAuthorPermissions } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [replyOpen, setReplyOpen] = useState({}); // { [commentId]: boolean }
  const [replyText, setReplyText] = useState({}); // { [commentId]: string }

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

  // Build parent -> replies map for simple one-level nesting
  const parents = Array.isArray(comments)
    ? comments.filter(
        (c) => c && (c.parentId === null || typeof c.parentId === "undefined")
      )
    : [];
  const repliesByParent = new Map();
  if (Array.isArray(comments)) {
    for (const c of comments) {
      if (c && c.parentId !== null && typeof c.parentId !== "undefined") {
        const key = String(c.parentId);
        const arr = repliesByParent.get(key) || [];
        arr.push(c);
        repliesByParent.set(key, arr);
      }
    }
  }

  const toggleReply = (commentId) => {
    setReplyOpen((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleReplySend = async (parentId) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour répondre.",
        variant: "destructive",
      });
      return;
    }
    const text = (replyText[parentId] || "").trim();
    if (!text) {
      toast({
        title: "Erreur",
        description: "Votre réponse est vide.",
        variant: "destructive",
      });
      return;
    }
    try {
      if (typeof onReplySubmit === "function") {
        await onReplySubmit(parentId, text);
      } else if (typeof onCommentSubmit === "function") {
        await onCommentSubmit({ content: text, parentId });
      }
      setReplyText((p) => ({ ...p, [parentId]: "" }));
      setReplyOpen((p) => ({ ...p, [parentId]: false }));
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Échec de l'envoi de la réponse.",
        variant: "destructive",
      });
    }
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
            {parents.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun commentaire</h3>
                <p className="text-muted-foreground">
                  Soyez le premier à commenter cette fiche !
                </p>
              </div>
            ) : (
              parents.map((comment) => {
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
                  const ok = window.confirm(
                    "Voulez-vous vraiment supprimer ce commentaire ?"
                  );
                  if (!ok) return;
                  onDeleteComment(comment.id);
                };

                const replies = repliesByParent.get(String(comment.id)) || [];

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

                    {/* Reply actions */}
                    {user && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReply(comment.id)}
                        >
                          <Reply className="h-4 w-4 mr-1" /> Répondre
                        </Button>
                      </div>
                    )}

                    {/* Reply editor */}
                    {replyOpen[comment.id] && (
                      <div className="mt-3 border-l pl-3">
                        <Textarea
                          placeholder={`Répondre à ${resolvedName}`}
                          value={replyText[comment.id] || ""}
                          onChange={(e) =>
                            setReplyText((p) => ({
                              ...p,
                              [comment.id]: e.target.value,
                            }))
                          }
                          rows={2}
                        />
                        <div className="mt-2 flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleReply(comment.id)}
                          >
                            Annuler
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleReplySend(comment.id)}
                          >
                            <Send className="h-4 w-4 mr-1" /> Envoyer
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies list */}
                    {replies.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {replies.map((rep) => {
                          const rAuthor = rep.author || {};
                          const rName =
                            (typeof rAuthor.name === "string" &&
                              rAuthor.name.trim()) ||
                            (typeof rep.authorName === "string" &&
                              rep.authorName.trim()) ||
                            (getAuthorName
                              ? getAuthorName(rep.authorId)
                              : null) ||
                            "Utilisateur";
                          const rAvatar = getProfilePictureUrl({
                            id: rAuthor.id || rep.authorId || "user",
                            sex: rAuthor.sex,
                            profile_picture: rAuthor.profile_picture,
                            profile_picture_url: rAuthor.profile_picture_url,
                          });
                          const rInitial = rName
                            ? rName.charAt(0).toUpperCase()
                            : "U";
                          const canDeleteReply =
                            user &&
                            (String(rep.authorId) === String(user.id) ||
                              user.role === "admin" ||
                              (typeof hasAuthorPermissions === "function" &&
                                hasAuthorPermissions()));

                          return (
                            <div
                              key={rep.id}
                              id={`comment-${rep.id}`}
                              className="ml-6 border rounded-lg p-3 bg-muted/30"
                            >
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-7 w-7">
                                    <AvatarImage src={rAvatar} alt={rName} />
                                    <AvatarFallback>{rInitial}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {rName}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground block">
                                      {new Date(
                                        rep.createdAt
                                      ).toLocaleDateString("fr-FR")}
                                    </span>
                                  </div>
                                </div>
                                {canDeleteReply && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                      if (!onDeleteComment) return;
                                      const ok = window.confirm(
                                        "Voulez-vous vraiment supprimer cette réponse ?"
                                      );
                                      if (!ok) return;
                                      onDeleteComment(rep.id);
                                    }}
                                    title="Supprimer la réponse"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed">
                                {rep.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
