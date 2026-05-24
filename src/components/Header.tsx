import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, User, Settings, Languages } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { forceLogout } from "@/utils/forceLogout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, profile, signOut, isInstrutor, isEstudante } = useAuth();
    const { t, language } = useTranslation();
    const { toggleLanguage } = useLanguage();
    const navigate = useNavigate();

  // Create fallback role checking for when profile hasn't loaded yet
  const userIsInstrutor = isInstrutor || user?.user_metadata?.role === 'instrutor';
  const userIsEstudante = isEstudante || user?.user_metadata?.role === 'estudante';

  const handleSignOut = async (buttonType: 'dropdown' | 'test' = 'dropdown') => {
    console.log(`🚪 Header logout button clicked - ${buttonType}`);

    try {
      const signOutResult = await signOut();
      const { error } = signOutResult;

      if (error) {
        console.error('❌ SignOut error:', error);
        toast({
          title: t("Logout Forçado"),
          description: t("Usando logout de emergência..."),
        });
        forceLogout();
        return;
      } else {
        toast({
          title: t("Sessão encerrada"),
          description: t("Você foi desconectado com sucesso."),
        });
        setTimeout(() => navigate('/'), 500);
      }
    } catch (error) {
      console.error('❌ Header logout exception:', error);
      toast({
        title: t("Logout de Emergência"),
        description: t("Usando logout forçado..."),
      });
      forceLogout();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-jw-navy text-white shadow-lg safe-top">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-2 sm:space-x-8">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 bg-jw-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SM</span>
              </div>
              <h1 className="header-title text-lg sm:text-xl font-semibold">{t('common.appName')}</h1>
            </div>
            
            <nav className="header-nav hidden md:flex items-center space-x-6">
                          {!user && (
                            <>
                              <Link to="/" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.home')}
                                                </Link>
                                                <Link to="/funcionalidades" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.features')}
                                                </Link>
                                                <a href="#faq" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.faq')}
                                                </a>
                                                <Link to="/congregacoes" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.congregations')}
                                                </Link>
                                                <Link to="/suporte" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.support')}
                                                </Link>
                                                <Link to="/sobre" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.about')}
                                                </Link>
                                                <Link to="/doar" className="hover:text-jw-gold transition-colors font-semibold">
                                                  {t('navigation.donate')}
                                                </Link>
                            </>
                          )}
            
                          {userIsInstrutor && (
                            <>
                              <Link to="/dashboard" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.dashboard')}
                                                </Link>
                                                <Link to="/estudantes" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.students')}
                                                </Link>
                                                <Link to="/programas" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.programs')}
                                                </Link>
                                                <Link to="/designacoes" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.assignments')}
                                                </Link>
                                                <Link to="/relatorios" className="hover:text-jw-gold transition-colors">
                                                  {t('navigation.reports')}
                                                </Link>
                            </>
                          )}
                        </nav>
          </div>
          
          {/* Mobile Navigation */}
          <MobileNavigation className="md:hidden" />
          
 <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-jw-gold p-2 sm:px-3"
              onClick={() => {
                console.log('🌐 Language toggle clicked. Current:', language);
                toggleLanguage();
                console.log('🌐 Language after toggle:', language === 'pt' ? 'en' : 'pt');
              }}
              title={language === 'pt' ? t('language.switchToEnglish') : t('language.switchToPortuguese')}
            >
              <Languages className="w-4 h-4 sm:mr-2" />
              <span className="hidden md:inline">
                {language === 'pt' ? t('language.english') : t('language.portuguese')}
              </span>
              <span className="ml-1 text-xs opacity-75">({language})</span>
            </Button>
            {user ? (
              <>
                {/* Debug Test Button - Remove after testing */}
                <Button
                                  onClick={() => {
                                    console.log('🧪 Direct test button clicked');
                                    handleSignOut('test');
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs bg-red-600 text-white hover:bg-red-700 hidden sm:inline-flex"
                                >
                                  {t('common.logout')}
                                </Button>
                                
                                {/* Emergency Logout Button */}
                                <Button
                                  onClick={() => {
                                    console.log('🚨 Emergency logout button clicked');
                                    forceLogout();
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs bg-orange-600 text-white hover:bg-orange-700 hidden sm:inline-flex"
                                >
                                  🚨 Logout
                                </Button>

                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 text-white hover:text-jw-gold p-2 sm:px-3">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline max-w-32 truncate">
                      {profile?.nome || user.user_metadata?.nome || user.email}
                    </span>
                    <Badge variant="outline" className="text-xs border-jw-gold text-jw-gold hidden sm:inline-flex">
                                          {(profile?.role === 'instrutor' || user.user_metadata?.role === 'instrutor') ? t('navigation.instructor') : t('navigation.student')}
                                                              </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">
                        {profile?.nome || user.user_metadata?.nome || user.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {profile?.congregacao || user.user_metadata?.congregacao || t('terms.congregation')}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {userIsInstrutor && (
                                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                                                            <Settings className="w-4 h-4 mr-2" />
                                                            {t('navigation.dashboard')}
                                                          </DropdownMenuItem>
                                                        )}
                                      
                                                        {userIsEstudante && (
                                                          <DropdownMenuItem onClick={() => navigate(`/estudante/${user.id}`)}>
                                                            <User className="w-4 h-4 mr-2" />
                                                            {t('navigation.myPortal')}
                                                          </DropdownMenuItem>
                                                        )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔴 Dropdown MenuItem clicked - calling handleSignOut');

                      // Ensure the dropdown stays open during logout
                      try {
                        await handleSignOut('dropdown');
                      } catch (error) {
                        console.error('🔴 Dropdown logout failed:', error);
                      }
                    }}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                                        {t('common.logout')}
                                      </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:text-jw-gold p-2 sm:px-3"
                                  onClick={() => navigate('/auth')}
                                >
                                  <span className="hidden sm:inline">{t('navigation.login')}</span>
                                  <span className="sm:hidden">Login</span>
                                </Button>
                                <Button
                                  variant="hero"
                                  size="sm"
                                  className="p-2 sm:px-3"
                                  onClick={() => navigate('/auth')}
                                >
                                  <span className="hidden sm:inline">{t('navigation.getStarted')}</span>
                                  <span className="sm:hidden">Start</span>
                                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;