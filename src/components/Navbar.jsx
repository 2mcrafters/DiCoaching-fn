import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getProfilePictureUrl } from "@/lib/avatarUtils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  BookOpen,
  Menu,
  X,
  Users,
  ShieldAlert,
  Compass,
  Edit2,
  Home,
  Info,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const Navbar = () => {
  const { user, logout, hasAuthorPermissions } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openLogoutDialog = () => setLogoutDialogOpen(true);
  const closeLogoutDialog = () => setLogoutDialogOpen(false);

  const isActive = (path) =>
    location.pathname === path ||
    (path === "/admin" && location.pathname.startsWith("/admin"));

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">
                <span style={{ color: "#884dee" }}>Di</span>
                <span className="text-black dark:text-white">coaching</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link to="/">
                <Button
                  variant={isActive("/") ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Accueil
                </Button>
              </Link>
              <Link to="/search">
                <Button
                  variant={isActive("/search") ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Compass className="mr-2 h-4 w-4" />
                  Découvrir
                </Button>
              </Link>
              <Link to="/authors">
                <Button
                  variant={isActive("/authors") ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Nos Auteurs
                </Button>
              </Link>
              <Link to="/Introduction">
                <Button
                  variant={isActive("/introduction") ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Introduction
                </Button>
              </Link>
              {user &&
                (hasAuthorPermissions
                  ? hasAuthorPermissions()
                  : user.role === "auteur" || user.role === "admin") && (
                  <Link to="/submit">
                    <Button
                      variant={isActive("/submit") ? "secondary" : "ghost"}
                      size="sm"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Contribuer
                    </Button>
                  </Link>
                )}
              {user && (
                <>
                  <Link to="/dashboard">
                    <Button
                      variant={isActive("/dashboard") ? "secondary" : "ghost"}
                      size="sm"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  {user.role === "admin" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={isActive("/admin") ? "secondary" : "ghost"}
                          size="sm"
                        >
                          Admin
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                          <Settings className="mr-2 h-4 w-4" />
                          Gestion
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/admin/reports")}
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          Signalements
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/admin/authors-ranking")}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Classement Auteurs
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>

            {/* Actions - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              <NotificationBell />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getProfilePictureUrl(user)}
                          alt={`${user.firstname} ${user.lastname}`}
                        />
                        <AvatarFallback>
                          {user.firstname
                            ? user.firstname.charAt(0).toUpperCase()
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {`${user.firstname || ""} ${
                            user.lastname || ""
                          }`.trim() ||
                            user.name ||
                            "Utilisateur"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link to="/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Mon Profil</span>
                      </DropdownMenuItem>
                    </Link>
                    {/* Settings link removed */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setLogoutDialogOpen(true)}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Se déconnecter</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Connexion
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Inscription</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <Link to="/" className="block">
                  <Button
                    variant={isActive("/") ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Accueil
                  </Button>
                </Link>
                <Link to="/search" className="block">
                  <Button
                    variant={isActive("/search") ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Compass className="mr-2 h-4 w-4" />
                    Découvrir
                  </Button>
                </Link>
                <Link to="/authors" className="block">
                  <Button
                    variant={isActive("/authors") ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Nos Auteurs
                  </Button>
                </Link>
                <Link to="/Introduction" className="block">
                  <Button
                    variant={isActive("/introduction") ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Info className="mr-2 h-4 w-4" />
                    Introduction
                  </Button>
                </Link>

                {user ? (
                  <>
                    <Link to="/dashboard" className="block">
                      <Button
                        variant={isActive("/dashboard") ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/profile" className="block">
                      <Button
                        variant={isActive("/profile") ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Mon Profil
                      </Button>
                    </Link>
                    {/* Mobile settings link removed */}
                    {(user.role === "auteur" || user.role === "admin") && (
                      <Link to="/submit" className="block">
                        <Button
                          variant={isActive("/submit") ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Contribuer
                        </Button>
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <div className="pt-2 border-t mt-2">
                        <Link to="/admin" className="block">
                          <Button
                            variant={isActive("/admin") ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Gestion
                          </Button>
                        </Link>
                        <Link to="/admin/reports" className="block">
                          <Button
                            variant={
                              isActive("/admin/reports") ? "default" : "ghost"
                            }
                            className="w-full justify-start"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Signalements
                          </Button>
                        </Link>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start mt-4"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setLogoutDialogOpen(true);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Se déconnecter
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Connexion
                      </Button>
                    </Link>
                    <Link to="/register" className="block">
                      <Button
                        className="w-full justify-start"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Inscription
                      </Button>
                    </Link>
                  </>
                )}

                <Button
                  variant="ghost"
                  className="w-full justify-start mt-4"
                  onClick={toggleTheme}
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Mode sombre
                    </>
                  ) : (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Mode clair
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la déconnexion</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr(e) de vouloir vous déconnecter ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" onClick={closeLogoutDialog}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                closeLogoutDialog();
                handleLogout();
              }}
            >
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
