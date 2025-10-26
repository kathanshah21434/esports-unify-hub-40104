
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Menu, X, LogOut, Settings, Wallet, MessageSquare, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  const navigation = [
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'Leaderboards', href: '/leaderboards' },
    { name: 'Live Matches', href: '/live-matches' },
    { name: 'Announcements', href: '/announcements' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/b263082d-907f-4305-88f6-cda9b8e2ecac.png" 
              alt="Battle Mitra Logo" 
              className="w-12 h-12 object-contain"
            />
            <span className="text-white font-bold text-xl">Battle Mitra</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
            ) : user ? (
              <>
                {/* Wallet Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-300 hover:text-purple-400 hover:bg-purple-500/10 flex items-center space-x-2 transition-colors duration-200"
                  onClick={() => navigate('/wallet')}
                >
                  <Wallet className="w-5 h-5" />
                  <span className="hidden sm:inline">Wallet</span>
                </Button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage 
                          src={user.user_metadata?.avatar_url || ''} 
                          alt={user.user_metadata?.name || user.email || 'User'} 
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                          {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal text-white">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem 
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => navigate('/profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem 
                       className="text-gray-300 hover:text-white hover:bg-gray-700"
                       onClick={() => navigate('/admin')}
                     >
                       <Settings className="mr-2 h-4 w-4" />
                       <span>Settings</span>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="bg-gray-700" />
                     <DropdownMenuItem 
                       className="text-gray-300 hover:text-white hover:bg-gray-700"
                       onClick={() => window.open('https://wa.me/7984491589', '_blank')}
                     >
                       <MessageSquare className="mr-2 h-4 w-4" />
                       <span>WhatsApp Support</span>
                     </DropdownMenuItem>
                     <DropdownMenuItem 
                       className="text-gray-300 hover:text-white hover:bg-gray-700"
                       onClick={() => window.open('tel:+7984491589', '_self')}
                     >
                       <Phone className="mr-2 h-4 w-4" />
                       <span>Call Support</span>
                     </DropdownMenuItem>
                     <DropdownMenuItem 
                       className="text-gray-300 hover:text-white hover:bg-gray-700"
                       onClick={() => window.open('mailto:battlemitra@gmail.com', '_self')}
                     >
                       <Mail className="mr-2 h-4 w-4" />
                       <span>Email Support</span>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem 
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Login/Signup buttons for non-authenticated users */
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-300 hover:text-white"
                  onClick={() => navigate('/auth')}
                >
                  Login
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  onClick={() => navigate('/auth')}
                >
                  Sign Up
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-purple-500/20">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-3 rounded-md transition-colors duration-200 text-center ${
                    isActive(item.href)
                      ? 'text-purple-400 bg-purple-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Support Links */}
              {user && (
                <div className="border-t border-gray-700 pt-2 mt-4">
                  <Link
                    to="/wallet"
                    className="flex items-center justify-center px-3 py-3 rounded-md text-gray-300 hover:text-purple-400 hover:bg-purple-500/10 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet
                  </Link>
                  <a
                    href="https://wa.me/7984491589"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-3 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp Support
                  </a>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
