import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Upload, Save, Lock, Trash2, Plus, Facebook, Instagram, Linkedin, Twitter, Link as LinkIcon, Camera, BadgeInfo } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import AddDocumentDialog from '@/components/profile/AddDocumentDialog';
import { Badge } from '@/components/ui/badge';

const SocialIcon = ({ network }) => {
  switch (network.toLowerCase()) {
    case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
    case 'instagram': return <Instagram className="h-5 w-5 text-pink-500" />;
    case 'linkedin': return <Linkedin className="h-5 w-5 text-blue-700" />;
    case 'x': return <Twitter className="h-5 w-5" />;
    default: return <LinkIcon className="h-5 w-5" />;
  }
};

const ChangePasswordDialog = ({ userId, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    const allUsers = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    const userIndex = allUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      setError("Utilisateur non trouvé.");
      return;
    }

    if (allUsers[userIndex].password !== currentPassword) {
      setError("Le mot de passe actuel est incorrect.");
      return;
    }

    allUsers[userIndex].password = newPassword;
    localStorage.setItem('coaching_dict_users', JSON.stringify(allUsers));
    
    setError('');
    onPasswordChanged();
    setIsDialogOpen(false);
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
          {error && <p className="col-span-4 text-center text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
          <Button type="submit" onClick={handleChangePassword}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MyProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      const allUsers = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
      const currentUserData = allUsers.find(u => u.id === user.id);
      setFormData({
        ...currentUserData,
        socials: currentUserData.socials || [],
        documents: currentUserData.documents || []
      });
    }
    setLoading(false);
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSocialChange = (index, field, value) => {
    const newSocials = [...formData.socials];
    newSocials[index][field] = value;
    setFormData(prev => ({ ...prev, socials: newSocials }));
  };

  const addSocialField = () => {
    setFormData(prev => ({ ...prev, socials: [...prev.socials, { network: '', url: '' }] }));
  };

  const removeSocialField = (index) => {
    const newSocials = [...formData.socials];
    newSocials.splice(index, 1);
    setFormData(prev => ({ ...prev, socials: newSocials }));
  };

  const handleAddDocument = (newDoc) => {
    setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), newDoc] }));
  };

  const handleRemoveDocument = (index) => {
    const newDocuments = [...formData.documents];
    newDocuments.splice(index, 1);
    setFormData(prev => ({ ...prev, documents: newDocuments }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allUsers = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    const updatedUsers = allUsers.map(u => u.id === user.id ? { ...u, ...formData } : u);
    localStorage.setItem('coaching_dict_users', JSON.stringify(updatedUsers));
    toast({
      title: "Profil mis à jour !",
      description: "Vos informations ont été sauvegardées avec succès.",
    });
  };

  const handlePasswordChanged = () => {
    toast({
      title: "Mot de passe modifié !",
      description: "Votre mot de passe a été mis à jour avec succès.",
    });
  };

  if (loading || !formData) {
    return <div className="text-center py-20">Chargement de votre profil...</div>;
  }

  return (
    <>
      <Helmet>
        <title>{formData.name ? `Mon Profil - ${formData.name}` : 'Mon Profil'} - Dictionnaire Collaboratif</title>
        <meta name="description" content="Gérez vos informations de profil, votre biographie et vos contributions." />
      </Helmet>
      <div className="min-h-screen creative-bg py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold text-foreground mb-8">Mon Profil</h1>
            <form onSubmit={handleSubmit}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>Mettez à jour vos informations de base.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={formData.profilePicture} alt={formData.name} />
                        <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
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
                      <p className="text-sm text-muted-foreground">Cliquez sur l'image pour la changer.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Nom complet</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="professionalStatus">Profession</Label>
                      <Input id="professionalStatus" name="professionalStatus" value={formData.professionalStatus} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <BadgeInfo className="h-5 w-5 text-primary" />
                      <Badge variant="secondary" className="text-base capitalize">{formData.role}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="biography">Biographie</Label>
                    <Textarea id="biography" name="biography" value={formData.biography} onChange={handleInputChange} rows={5} />
                  </div>
                </CardContent>
              </Card>

              {formData.role === 'auteur' && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Réseaux Sociaux</CardTitle>
                    <CardDescription>Gérez vos liens vers les réseaux sociaux.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.socials.map((social, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 border rounded-md p-2">
                          <SocialIcon network={social.network} />
                          <Input className="border-none focus-visible:ring-0 font-medium" value={social.network} readOnly />
                          <Input className="border-none focus-visible:ring-0" placeholder="URL du profil" value={social.url} onChange={(e) => handleSocialChange(index, 'url', e.target.value)} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialField(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addSocialField}>
                      <Plus className="h-4 w-4 mr-2" /> Ajouter un réseau
                    </Button>
                  </CardContent>
                </Card>
              )}

              {formData.role === 'auteur' && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Gérez vos documents publics (certifications, etc.). Seuls les PDF et images sont acceptés.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDocument(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <AddDocumentDialog onAddDocument={handleAddDocument} />
                  </CardContent>
                </Card>
              )}

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>Gérez les paramètres de sécurité de votre compte.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangePasswordDialog userId={user.id} onPasswordChanged={handlePasswordChanged} />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Sauvegarder les modifications
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default MyProfile;