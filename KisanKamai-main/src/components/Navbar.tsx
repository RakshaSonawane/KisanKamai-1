import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, Tractor, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, loading } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'mr' : 'en');
  };

  const getDashboardLink = () => {
    if (loading) return '#';
    if (!profile) return '/';
    switch (profile.role) {
      case UserRole.OWNER: return '/owner-dashboard';
      case UserRole.RENTER: return '/renter-dashboard';
      case UserRole.ADMIN: return '/admin-dashboard';
      default: return '/';
    }
  };

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="bg-white p-1 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/gokisaan.firebasestorage.app/o/logo.png?alt=media&token=e2b1aa9f-90bf-47b6-90ce-d73a311f39bd" 
                  alt="KisaanKamai Logo" 
                  className="h-8 w-8 md:h-10 md:w-10 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://img.icons8.com/color/96/tractor.png";
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="ml-3 text-xl md:text-2xl font-black text-emerald-900 tracking-tight">
                Kisaan<span className="text-emerald-600">Kamai</span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-stone-600 hover:text-emerald-600 font-medium transition-colors">
              {t.nav.home}
            </Link>
            
            {user ? (
              <>
                {loading || !profile ? (
                  <div className="flex items-center space-x-2 text-stone-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{loading ? t.common.loading : t.common.settingUp}</span>
                  </div>
                ) : (
                  <Link to={getDashboardLink()} className="text-stone-600 hover:text-emerald-600 font-medium transition-colors">
                    {t.nav.dashboard}
                  </Link>
                )}
                <div className="flex items-center space-x-4 border-l border-stone-200 pl-4">
                  <div className="flex items-center space-x-2 text-stone-700">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">{profile?.displayName || user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-stone-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-stone-600 hover:text-emerald-600 font-medium transition-colors">
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}

            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-stone-600 hover:text-emerald-600 transition-colors border border-stone-200 px-3 py-1 rounded-full text-sm font-medium"
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'en' ? 'मराठी' : 'English'}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
             <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-stone-600 border border-stone-200 px-2 py-1 rounded-full text-xs font-medium"
            >
              <Globe className="h-3 w-3" />
              <span>{language === 'en' ? 'मराठी' : 'English'}</span>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-stone-600 hover:text-emerald-600"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-stone-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 text-stone-600 font-medium"
                onClick={() => setIsOpen(false)}
              >
                {t.nav.home}
              </Link>
              {user ? (
                <>
                  {loading || !profile ? (
                    <div className="px-3 py-2 text-stone-400 flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{loading ? t.common.loading : t.common.settingUp}</span>
                    </div>
                  ) : (
                    <Link
                      to={getDashboardLink()}
                      className="block px-3 py-2 text-stone-600 font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      {t.nav.dashboard}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-red-600 font-medium"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-stone-600 font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-emerald-600 font-bold"
                    onClick={() => setIsOpen(false)}
                  >
                    {t.nav.register}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
