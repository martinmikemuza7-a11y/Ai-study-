import React, { useState } from 'react';
import { getDownloadConfig, DownloadAppConfig } from '../../config/downloadConfig';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { AppDemoSection } from './AppDemoSection';
import { DownloadSection } from './DownloadSection';
import { FaqSection } from './FaqSection';
import { Footer } from './Footer';
import { ConfigUrlsModal } from './ConfigUrlsModal';
import { LegalModals } from './LegalModals';

interface LandingPageProps {
  onLaunchWebApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchWebApp }) => {
  const [downloadConfig, setDownloadConfig] = useState<DownloadAppConfig>(getDownloadConfig());
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'contact' | null>(null);

  const [initialNoticePlatform] = useState<'android' | 'windows' | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const notice = params.get('notice');
      if (notice === 'android-binary-pending') return 'android';
      if (notice === 'windows-binary-pending') return 'windows';
    }
    return null;
  });

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    if (initialNoticePlatform) {
      // If user came via redirect from /api/download/* or /apk, scroll to downloads
      setTimeout(() => {
        handleScrollToSection('downloads');
      }, 100);
    }
  }, [initialNoticePlatform]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white antialiased transition-colors">
      {/* Navigation Bar */}
      <LandingNavbar
        onLaunchWebApp={onLaunchWebApp}
        onScrollToSection={handleScrollToSection}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection
          onLaunchWebApp={onLaunchWebApp}
          onScrollToDownloads={() => handleScrollToSection('downloads')}
        />

        {/* Key Features and Benefits */}
        <FeaturesSection />

        {/* App Screenshots and Interactive Demo */}
        <AppDemoSection onLaunchWebApp={onLaunchWebApp} />

        {/* Download App Section with Clear Android APK & Windows EXE Buttons */}
        <DownloadSection
          config={downloadConfig}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
          onLaunchWebApp={onLaunchWebApp}
          initialNoticePlatform={initialNoticePlatform}
        />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer with Privacy Policy, Terms, and Contact */}
      <Footer
        onOpenLegal={(type) => setLegalModalType(type)}
        onLaunchWebApp={onLaunchWebApp}
        onScrollToSection={handleScrollToSection}
      />

      {/* Download URLs Configuration Modal */}
      <ConfigUrlsModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={(newConfig) => setDownloadConfig(newConfig)}
      />

      {/* Privacy Policy, Terms of Service & Contact Modals */}
      <LegalModals
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
};
