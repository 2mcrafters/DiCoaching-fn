import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { MessageCircle, Send, Info } from 'lucide-react';

const FicheComments = ({ comments, onCommentSubmit, getAuthorName }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Connexion requise", description: "Vous devez être connecté pour commenter.", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) {
      toast({ title: "Erreur", description: "Veuillez saisir un commentaire.", variant: "destructive" });
      return;
    }
    onCommentSubmit(newComment);
    setNewComment('');
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
            Discussion ({comments.length})
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-sm pt-2 text-muted-foreground bg-muted/30 p-2 rounded-md border border-input">
            <Info className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Cet espace est dédié à la discussion. Pour suggérer des changements, veuillez utiliser le bouton "Proposer une modification".</span>
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
                  <Button type="submit"><Send className="h-4 w-4 mr-2" />Publier</Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground mb-2">Connectez-vous pour participer à la discussion</p>
              <Link to="/login"><Button variant="outline" size="sm">Se connecter</Button></Link>
            </div>
          )}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun commentaire</h3>
                <p className="text-muted-foreground">Soyez le premier à commenter cette fiche !</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {getAuthorName(comment.authorId).charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{getAuthorName(comment.authorId)}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FicheComments;