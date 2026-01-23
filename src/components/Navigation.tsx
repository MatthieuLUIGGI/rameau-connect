import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, KeyRound, Users, Newspaper, BarChart3, Mail, User, LogOut, LogIn, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAG, signOut } = useAuth();

  const navItems = [
    { path: "/", label: "Accueil", icon: Home },
    { path: "/badges-vigik", label: "Badges Vigik", icon: KeyRound },
    { path: "/syndic", label: "Syndic", icon: Users },
    { path: "/actualites", label: "Actualités", icon: Newspaper },
    { path: "/ag", label: "AG", icon: BarChart3 },
    { path: "/conseil-syndical", label: "Conseil Syndical", icon: Shield },
    { path: "/sondages", label: "Consultations", icon: BarChart3 },
    { path: "/contact", label: "Contactez-nous", icon: Mail },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-semibold text-foreground">Le Rameau</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            
            {user && <NotificationBell />}
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Mon profil</Link>
                  </DropdownMenuItem>
                  {isAG && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/membres">Nombre membres</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/badges-vigik">Gérer les badges Vigik</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/syndic">Gérer le syndic</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/ag">Gérer les AG</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/conseil-syndical">Gérer le Conseil Syndical</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/actualites">Gérer les actualités</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/sondages">Gérer les consultations</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Connexion
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            <div className="pt-2 border-t border-border mt-2">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="font-medium">Thème</span>
                <ThemeToggle />
              </div>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Mon profil</span>
                  </Link>
                  {isAG && (
                    <>
                      <Link
                        to="/membres"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">Nombre membres</span>
                      </Link>
                      <Link
                        to="/admin/badges-vigik"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">Gérer les badges Vigik</span>
                      </Link>
                      <Link
                        to="/admin/syndic"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">Gérer le syndic</span>
                      </Link>
                      <Link
                        to="/admin/ag"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">Gérer les AG</span>
                      </Link>
                      <Link
                        to="/admin/conseil-syndical"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">Gérer le Conseil Syndical</span>
                      </Link>
                      <Link
                        to="/admin/actualites"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">Gérer les actualités</span>
                      </Link>
                      <Link
                        to="/admin/sondages"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">Gérer les consultations</span>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Déconnexion</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <LogIn className="h-5 w-5" />
                  <span className="font-medium">Connexion</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
