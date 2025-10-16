import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Edit, Share2, Heart, User, Calendar, Tag } from 'lucide-react';

const FicheHeader = ({ term, authorName }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAction = (feature) => {
    toast({
      title: `🚧 ${feature} en cours de développement`,
      description:
        "Cette fonctionnalité n'est pas encore implémentée, mais vous pouvez la demander ! 🚀",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: term.title,
        text: term.shortDefinition,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié !",
        description:
          "Le lien de cette fiche a été copié dans le presse-papiers.",
      });
    }
  };

  // Edit allowed for: admin, or the term owner (author of this term)
  const canEdit =
    !!user && (user.role === "admin" || user.id === term.authorId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-8"
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="mb-2">
                  <Tag className="h-3 w-3 mr-1" />
                  {term.category}
                </Badge>
              </div>
              <CardTitle className="text-3xl mb-4">{term.title}</CardTitle>
              <CardDescription className="text-lg">
                {term.shortDefinition}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{authorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(term.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("J'aime")}
              >
                <Heart className="h-4 w-4 mr-2" />
                J'aime
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              {canEdit && (
                <Link to={`/edit/${term.slug}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

export default FicheHeader;