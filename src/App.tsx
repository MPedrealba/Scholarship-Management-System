import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { HeaderNav } from './components/common/HeaderNav';
import { HeroBanner } from './components/home/HeroBanner';
import { QuickServices } from './components/home/QuickServices';
import { CollegesGrid } from './components/home/CollegesGrid';
import { AnnouncementsSection } from './components/home/AnnouncementsSection';
import { ScholarshipModule } from './components/scholarships/ScholarshipModule';
import { Footer } from './components/common/Footer';
import { LoginPage } from './components/auth/LoginPage';

function AppContent() {
  const [currentView, setCurrentView] = useState<'home' | 'scholarships' | 'login'>('home');
  const [collegeFilterForModule, setCollegeFilterForModule] = useState<string>('All');

  // Synchronize with URL hash or path for direct routing (e.g. #login, #scholarships, or /scholarships)
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash.includes('login') || path.includes('login')) {
        setCurrentView('login');
      } else if (hash.includes('scholarship') || path.includes('scholarship')) {
        setCurrentView('scholarships');
      } else {
        setCurrentView('home');
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (view: 'home' | 'scholarships' | 'login') => {
    setCurrentView(view);
    if (view === 'login') {
      window.location.hash = 'login';
    } else if (view === 'scholarships') {
      window.location.hash = 'scholarships';
    } else {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCollegeFromHome = (collegeCode: string) => {
    setCollegeFilterForModule(collegeCode);
    navigateTo('scholarships');
  };

  // If in dedicated standalone Login View
  if (currentView === 'login') {
    return (
      <LoginPage
        onBackToHome={() => navigateTo('home')}
        onLoginSuccess={() => navigateTo('scholarships')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans selection:bg-amber-300 selection:text-maroon-900">
      {/* 1. Header Navigation Bar (Institutional Maroon + Gold) */}
      <HeaderNav currentView={currentView} onNavigate={navigateTo} />

      {/* 2. Main Viewport Content */}
      <main className="flex-1">
        {currentView === 'home' ? (
          <div>
            {/* Hero Banner Carousel */}
            <HeroBanner onOpenScholarships={() => navigateTo('scholarships')} />

            {/* Quick Access e-Services (Featuring Scholarship Portal) */}
            <QuickServices onOpenScholarships={() => navigateTo('scholarships')} />

            {/* Colleges Grid */}
            <CollegesGrid onSelectCollegeFilter={handleSelectCollegeFromHome} />

            {/* Campus Announcements & Advisories */}
            <AnnouncementsSection onOpenScholarships={() => navigateTo('scholarships')} />
          </div>
        ) : (
          <ScholarshipModule
            onBackToHome={() => navigateTo('home')}
            initialCollegeFilter={collegeFilterForModule}
          />
        )}
      </main>

      {/* 3. Official Institutional Footer */}
      <Footer
        onNavigateHome={() => navigateTo('home')}
        onNavigateScholarships={() => navigateTo('scholarships')}
        onNavigateLogin={() => navigateTo('login')}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
