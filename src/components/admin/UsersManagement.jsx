import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Users, Trash2, Search, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import UserDetailsDialog from '@/components/admin/UserDetailsDialog';

const UsersManagement = ({ allUsers, currentUser, onUpdate }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'auteur':
        return <Badge className="bg-blue-100 text-blue-800">Auteur</Badge>;
      case 'chercheur':
        return <Badge className="bg-green-100 text-green-800">Chercheur</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleUserRoleChange = (userId, newRole) => {
    const users = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    localStorage.setItem('coaching_dict_users', JSON.stringify(updatedUsers));
    onUpdate();
    toast({
      title: "Rôle modifié !",
      description: "Le rôle de l'utilisateur a été mis à jour.",
    });
  };

  const handleDeleteUser = (userId) => {
    if (userId === currentUser.id) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas supprimer votre propre compte.",
        variant: "destructive",
      });
      return;
    }
    const users = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('coaching_dict_users', JSON.stringify(updatedUsers));
    onUpdate();
    toast({
      title: "Utilisateur supprimé !",
      description: "L'utilisateur a été supprimé définitivement.",
    });
  };

  const filteredUsers = allUsers
    .filter(u => u.status === 'active')
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u =>
      searchQuery.trim() === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des utilisateurs</CardTitle>
        <CardDescription>Gérez les rôles et permissions des utilisateurs actifs.</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="admin">Administrateurs</SelectItem>
              <SelectItem value="auteur">Auteurs</SelectItem>
              <SelectItem value="chercheur">Chercheurs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-muted-foreground">Aucun utilisateur ne correspond à vos critères.</p>
            </div>
          ) : (
            filteredUsers.map((userData) => (
              <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{userData.name}</h4>
                      {getRoleBadge(userData.role)}
                      {userData.id === currentUser.id && <Badge variant="outline" className="text-xs">Vous</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{userData.email}</p>
                    <p className="text-xs text-muted-foreground">Inscrit le {new Date(userData.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <UserDetailsDialog user={userData} />
                  <Select
                    value={userData.role}
                    onValueChange={(newRole) => handleUserRoleChange(userData.id, newRole)}
                    disabled={userData.id === currentUser.id}
                  >
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chercheur">Chercheur</SelectItem>
                      <SelectItem value="auteur">Auteur</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {userData.id !== currentUser.id && (
                    <Button variant="outline" size="sm" onClick={() => handleDeleteUser(userData.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersManagement;