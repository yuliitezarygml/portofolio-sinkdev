import { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LoadingScreen from './components/LoadingScreen';

// Ленивая загрузка компонентов
const Navigation = lazy(() => import('./components/Navigation'));
const Hero = lazy(() => import('./components/Hero'));
const Projects = lazy(() => import('./components/Projects'));
const About = lazy(() => import('./components/About'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));
const FilesPage = lazy(() => import('./pages/FilesPage'));
const ApiPage = lazy(() => import('./pages/ApiPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const GitHubStatsPage = lazy(() => import('./pages/GitHubStatsPage'));

// Компонент загрузки для Suspense
const SuspenseLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
  </div>
);

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Portfolio Page Component
  const PortfolioPage = () => (
    <div className="bg-black text-white">
      <Suspense fallback={<SuspenseLoader />}>
        <Navigation />
        <main className="relative">
          <Hero />
          <Projects />
          <About />
          <Contact />
        </main>
        <Footer />
      </Suspense>
    </div>
  );

  return (
    <Router>
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>

      {!isLoading && (
        <Suspense fallback={<SuspenseLoader />}>
          <Routes>
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/files/*" element={<FilesPage />} />
            <Route path="/api" element={<ApiPage />} />
            <Route path="/github" element={<GitHubStatsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Suspense>
      )}
    </Router>
  );
}

export default App;