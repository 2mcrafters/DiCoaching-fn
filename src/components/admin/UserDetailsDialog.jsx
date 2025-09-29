import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, User, Mail, Briefcase, Calendar, Link as LinkIcon, FileText, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import DocumentViewerDialog from '@/components/DocumentViewerDialog';

const SocialIcon = ({ network }) => {
  switch (network.toLowerCase()) {
    case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
    case 'instagram': return <Instagram className="h-5 w-5 text-pink-500" />;
    case 'linkedin': return <Linkedin className="h-5 w-5 text-blue-700" />;
    case 'x': return <Twitter className="h-5 w-5" />;
    default: return <LinkIcon className="h-5 w-5" />;
  }
};

const UserDetailsDialog = ({ user }) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'auteur': return <Badge className="bg-blue-100 text-blue-800">Auteur</Badge>;
      case 'chercheur': return <Badge className="bg-green-100 text-green-800">Chercheur</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDocumentClick = (doc) => {
    const docWithName = { ...doc, name: doc.title };
    const isSupported = /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(docWithName.name);
    if (isSupported) {
        setSelectedDoc(docWithName);
        setIsViewerOpen(true);
    } else {
        const link = document.createElement('a');
        link.href = docWithName.url;
        link.download = docWithName.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
            <DialogDescription>Informations complètes sur {user.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profilePicture} alt={user.name} />
                <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(user.role)}
                  {user.status && getStatusBadge(user.status)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{user.professionalStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Inscrit le: {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            {user.biography && (
              <div>
                <h4 className="font-semibold mb-2">Biographie</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{user.biography}</p>
              </div>
            )}
            {user.socials && user.socials.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Réseaux Sociaux</h4>
                <div className="space-y-2">
                  {user.socials.map((social, index) => (
                    <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <SocialIcon network={social.network} />
                      <span>{social.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {user.documents && user.documents.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Documents fournis</h4>
                <div className="space-y-2">
                  {user.documents.map((doc, index) => (
                    <button key={index} onClick={() => handleDocumentClick(doc)} className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <FileText className="h-4 w-4" />
                      <span>{doc.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <DocumentViewerDialog isOpen={isViewerOpen} onOpenChange={setIsViewerOpen} document={selectedDoc} />
    </>
  );
};

export default UserDetailsDialog;