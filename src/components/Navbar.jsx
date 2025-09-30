import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Moon, Sun, User, LogOut, Settings, BookOpen, Menu, X, Users, ShieldAlert, Compass, Edit2 } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || (path === '/admin' && location.pathname.startsWith('/admin'));


  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl text-foreground">
              Dico<span className="creative-gradient-text">Coaching</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
             <Link to="/search">
              <Button 
                variant={isActive('/search') ? 'secondary' : 'ghost'}
                size="sm"
              >
                <Compass className="mr-2 h-4 w-4" />
                Découvrir
              </Button>
            </Link>
             <Link to="/authors">
              <Button 
                variant={isActive('/authors') ? 'secondary' : 'ghost'}
                size="sm"
              >
                Nos Auteurs
              </Button>
            </Link>
            <Link to="/api-test">
              <Button 
                variant={isActive('/api-test') ? 'secondary' : 'ghost'}
                size="sm"
              >
                🔧 API Test
              </Button>
            </Link>
            {user && (user.role === 'auteur' || user.role === 'admin') && (
              <Link to="/submit">
                <Button 
                  variant={isActive('/submit') ? 'secondary' : 'ghost'}
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
                    variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    Dashboard
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button 
                        variant={isActive('/admin') ? 'secondary' : 'ghost'}
                        size="sm"
                      >
                        Admin
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Gestion
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/reports')}>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Signalements
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/authors-ranking')}>
                         <Users className="mr-2 h-4 w-4" />
                        Classement Auteurs
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>

          {/* Search Bar & Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
             <form onSubmit={handleSearch} className="w-full max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un terme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </form>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            
            <NotificationBell />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profilePicture} alt={user.name} />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
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
                  <Link to="/settings">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
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
                  <Button size="sm">
                    Inscription
                  </Button>
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
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher un terme..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </form>
              
              <Link to="/search" className="block">
                <Button 
                  variant={isActive('/search') ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Compass className="mr-2 h-4 w-4" />
                  Découvrir
                </Button>
              </Link>
              <Link to="/authors" className="block">
                <Button 
                  variant={isActive('/authors') ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Nos Auteurs
                </Button>
              </Link>
              <Link to="/api-test" className="block">
                <Button 
                  variant={isActive('/api-test') ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🔧 API Test
                </Button>
              </Link>

              {user ? (
                <>
                  <Link to="/dashboard" className="block">
                    <Button 
                      variant={isActive('/dashboard') ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Button>
                  </Link>
                   <Link to="/profile" className="block">
                    <Button 
                      variant={isActive('/profile') ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Mon Profil
                    </Button>
                  </Link>
                  <Link to="/settings" className="block">
                    <Button 
                      variant={isActive('/settings') ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Button>
                  </Link>
                  {(user.role === 'auteur' || user.role === 'admin') && (
                    <Link to="/submit" className="block">
                      <Button 
                        variant={isActive('/submit') ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Contribuer
                      </Button>
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <div className="pt-2 border-t mt-2">
                       <Link to="/admin" className="block">
                        <Button 
                          variant={isActive('/admin') ? 'default' : 'ghost'}
                          className="w-full justify-start"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Gestion
                        </Button>
                      </Link>
                      <Link to="/admin/reports" className="block">
                        <Button 
                          variant={isActive('/admin/reports') ? 'default' : 'ghost'}
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
                    onClick={() => {handleLogout(); setMobileMenuOpen(false);}}
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
                {theme === 'light' ? (
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
  );
};

export default Navbar;