import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Users, Trash2, Search, Eye, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import UserDetailsDialog from "@/components/admin/UserDetailsDialog";
import apiService from "@/services/api";

const UsersManagement = ({ allUsers, currentUser, onUpdate }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    sex: "",
    phone: "",
    professionalStatus: "",
    role: "chercheur",
    presentation: "",
  });

  // Charger les utilisateurs depuis la base de données
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case "author":
        return <Badge className="bg-blue-100 text-blue-800">Auteur</Badge>;
      case "chercheur":
        return <Badge className="bg-green-100 text-green-800">Chercheur</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toString().toLowerCase();
    switch (s) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmé</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800">En attente</Badge>
        );
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspendu</Badge>;
      default:
        return s ? <Badge variant="outline">{status}</Badge> : null;
    }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      await apiService.updateUser(userId, { role: newRole });

      // Mettre à jour localement
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      toast({
        title: "Rôle modifié !",
        description: "Le rôle de l'utilisateur a été mis à jour.",
      });
    } catch (error) {
      console.error("Erreur lors de la modification du rôle:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle de l'utilisateur.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas supprimer votre propre compte.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiService.deleteUser(userId);

      // Mettre à jour localement
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));

      toast({
        title: "Utilisateur supprimé !",
        description: "L'utilisateur a été supprimé définitivement.",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (
      !newUser.email ||
      !newUser.password ||
      !newUser.firstName ||
      !newUser.lastName
    ) {
      toast({
        title: "Erreur",
        description:
          "Les champs email, mot de passe, prénom et nom sont requis.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiService.createUser(newUser);

      // Ajouter le nouvel utilisateur à la liste
      setUsers((prevUsers) => [...prevUsers, response.data]);

      // Réinitialiser le formulaire
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        sex: "",
        phone: "",
        professionalStatus: "",
        role: "chercheur",
        presentation: "",
      });
      setIsAddDialogOpen(false);

      toast({
        title: "Utilisateur créé !",
        description: "Le nouvel utilisateur a été ajouté avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      let errorMessage = "Impossible de créer l'utilisateur.";

      if (error.message.includes("409")) {
        errorMessage = "Cet email est déjà utilisé.";
      } else if (error.message.includes("400")) {
        errorMessage = "Données invalides. Vérifiez tous les champs.";
      }

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users
    .filter((u) => {
      if (roleFilter === "all") return true;
      if (roleFilter === "author") return u.role === "author";
      return u.role === roleFilter;
    })
    .filter(
      (u) =>
        searchQuery.trim() === "" ||
        (u.firstname &&
          u.firstname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.lastname &&
          u.lastname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gestion des utilisateurs</span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleAddUser}
                className="space-y-4 max-h-[70vh] overflow-y-auto"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sex">Sexe</Label>
                    <Select
                      value={newUser.sex}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, sex: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homme">Homme</SelectItem>
                        <SelectItem value="femme">Femme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone: e.target.value })
                      }
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="professionalStatus">
                    Statut professionnel
                  </Label>
                  <Select
                    value={newUser.professionalStatus}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, professionalStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Étudiant">Étudiant</SelectItem>
                      <SelectItem value="Enseignant / Professeur">
                        Enseignant / Professeur
                      </SelectItem>
                      <SelectItem value="Coach / Formateur">
                        Coach / Formateur
                      </SelectItem>
                      <SelectItem value="Chercheur">Chercheur</SelectItem>
                      <SelectItem value="Professionnel RH">
                        Professionnel RH
                      </SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="role">Rôle *</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="chercheur">Chercheur</SelectItem>
                      <SelectItem value="author">Auteur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="presentation">
                    Présentation (facultatif)
                  </Label>
                  <Input
                    id="presentation"
                    value={newUser.presentation}
                    onChange={(e) =>
                      setNewUser({ ...newUser, presentation: e.target.value })
                    }
                    placeholder="Une courte présentation de l'utilisateur..."
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" className="flex-1">
                    Créer l'utilisateur
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Gérez les rôles et permissions des utilisateurs actifs.
        </CardDescription>
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
              <SelectItem value="author">Auteurs</SelectItem>
              <SelectItem value="chercheur">Chercheurs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Chargement des utilisateurs...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Aucun utilisateur trouvé
              </h3>
              <p className="text-muted-foreground">
                {users.length === 0
                  ? "Aucun utilisateur dans la base de données. Utilisez le bouton 'Ajouter un utilisateur' pour créer le premier compte."
                  : "Aucun utilisateur ne correspond à vos critères de recherche."}
              </p>
            </div>
          ) : (
            filteredUsers.map((userData) => {
              const displayName =
                `${userData.firstname || ""} ${
                  userData.lastname || ""
                }`.trim() || userData.email;
              const initials =
                userData.firstname && userData.lastname
                  ? `${userData.firstname.charAt(0)}${userData.lastname.charAt(
                      0
                    )}`.toUpperCase()
                  : userData.email.charAt(0).toUpperCase();

              return (
                <div
                  key={userData.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{displayName}</h4>
                        {getRoleBadge(userData.role)}
                        {getStatusBadge(userData.status)}
                        {userData.id === currentUser?.id && (
                          <Badge variant="outline" className="text-xs">
                            Vous
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {userData.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Inscrit le{" "}
                        {new Date(
                          userData.created_at || userData.createdAt
                        ).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <UserDetailsDialog user={userData} />
                    <Select
                      value={userData.role}
                      onValueChange={(newRole) =>
                        handleUserRoleChange(userData.id, newRole)
                      }
                      disabled={userData.id === currentUser?.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Utilisateur</SelectItem>
                        <SelectItem value="chercheur">Chercheur</SelectItem>
                        <SelectItem value="author">Auteur</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {userData.id !== currentUser?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(userData.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersManagement;
