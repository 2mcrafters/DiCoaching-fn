import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAuthorBadge } from '@/lib/badges';
import { getProfilePictureUrl } from "@/lib/avatarUtils";
import { User, ArrowRight } from "lucide-react";

const AuthorCard = ({ author }) => {
  const rawScore = Number(author.score);
  const badgeScore =
    Number.isFinite(rawScore) && rawScore > 0
      ? rawScore
      : (Number(author.termsAdded) || 0) * 10;
  const badge = getAuthorBadge(badgeScore);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="text-center overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6">
          <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-lg">
            <AvatarImage
              src={getProfilePictureUrl(author)}
              alt={`${author.firstname} ${author.lastname}`}
            />
            <AvatarFallback>
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
        </div>
        <CardContent className="p-6 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold">
              {`${author.firstname || ""} ${author.lastname || ""}`.trim() ||
                author.name ||
                "Mohamed Rachid Belhadj"}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {author.professional_status || author.professionalStatus || ""}
            </p>
            <div className="mt-3">
              <Badge variant={badge.variant} className="text-sm">
                {badge.icon} {badge.name}
              </Badge>
            </div>
          </div>
          <div className="mt-6">
            <Link to={`/author/${author.id}`}>
              <Button className="w-full">
                Voir le profil <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuthorCard;
