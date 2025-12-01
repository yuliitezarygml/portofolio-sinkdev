import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faDesktop } from '@fortawesome/free-solid-svg-icons';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showEndpoints, setShowEndpoints] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Apply theme to document and save to localStorage
  useEffect(() => {
    const root = document.documentElement;

    // Save theme to localStorage
    localStorage.setItem('theme', theme);

    if (theme === 'white') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else if (theme === 'black') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
      } else {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
      }
    }
  }, [theme]);

  // Listen for system theme changes when auto is selected
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const root = document.documentElement;
        if (mediaQuery.matches) {
          root.classList.add('dark-theme');
          root.classList.remove('light-theme');
        } else {
          root.classList.add('light-theme');
          root.classList.remove('dark-theme');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    if (isOpen) {
      const allSections = document.querySelectorAll('section, footer');
      allSections.forEach(section => {
        (section as HTMLElement).style.filter = 'blur(8px)';
        (section as HTMLElement).style.transition = 'filter 0.3s ease';
      });
      // Keep navbar sharp
      const navbar = document.querySelector('header');
      if (navbar) {
        (navbar as HTMLElement).style.filter = 'none';
      }
    } else {
      const allSections = document.querySelectorAll('section, footer');
      allSections.forEach(section => {
        (section as HTMLElement).style.filter = 'none';
      });
    }

    return () => {
      const allSections = document.querySelectorAll('section, footer');
      allSections.forEach(section => {
        (section as HTMLElement).style.filter = 'none';
      });
    };
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEndpoints(false);
      }
    };

    if (showEndpoints) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEndpoints]);


  const navItems = [
    { href: '#projects', label: 'Projects', type: 'scroll' },
    { href: '#about', label: 'About', type: 'scroll' },
    { href: '/files', label: 'Files', type: 'link' },
    { href: '/github', label: 'GitHub', type: 'link' },
    { href: '#contact', label: 'Contact', type: 'scroll' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  const handleNavClick = (item: any) => {
    if (item.type === 'scroll') {
      scrollToSection(item.href);
    } else {
      setIsOpen(false);
    }
  };

  const endpoints = [
    { path: '/', name: 'Home', description: 'Portfolio & Projects', status: 'active' },
    { path: '/files', name: 'Files', description: 'File Management', status: 'active' },
    { path: '/github', name: 'GitHub', description: 'GitHub Statistics', status: 'active' },
    { path: '/admin', name: 'Admin', description: 'Control Panel', status: 'active' },
    { path: '/api', name: 'API', description: 'Backend Services', status: 'active' },
  ];

  const themes = [
    { name: 'Dark', value: 'black', icon: faMoon },
    { name: 'Light', value: 'white', icon: faSun },
    { name: 'Auto', value: 'system', icon: faDesktop },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-40 safe-top"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
        backdropFilter: 'blur(40px) saturate(200%) brightness(110%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(110%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo with Endpoints Menu */}
          <div className="relative" ref={dropdownRef}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-xl md:text-2xl font-bold tracking-tight cursor-pointer"
              onClick={() => setShowEndpoints(!showEndpoints)}
            >
              <span className="text-white">Sink</span>
              <span className="text-blue-400">Dev</span>
            </motion.div>

            {/* Endpoints & Settings Menu */}
            <AnimatePresence>
              {showEndpoints && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
                  className="absolute top-full left-0 mt-2 w-80 rounded-xl z-50 endpoints-menu"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="p-4">
                    {/* Navigation Section */}
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        Navigation
                      </div>
                      <div className="space-y-1">
                        {endpoints.map((endpoint, index) => (
                          <motion.div
                            key={endpoint.path}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`group flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 ${endpoint.status === 'active'
                                ? 'hover:bg-white/5 cursor-pointer'
                                : 'opacity-50 cursor-not-allowed'
                              }`}
                            onClick={() => {
                              if (endpoint.status === 'active') {
                                window.location.href = endpoint.path;
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <code className="text-xs font-mono text-gray-400 bg-gray-800/50 px-2 py-1 rounded border border-gray-700/50">
                                {endpoint.path}
                              </code>
                              <span className="text-sm font-medium text-white">{endpoint.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {endpoint.status === 'coming-soon' && (
                                <span className="text-xs text-yellow-400 font-medium px-1.5 py-0.5 bg-yellow-400/10 rounded">
                                  SOON
                                </span>
                              )}
                              {endpoint.status === 'active' && (
                                <motion.svg
                                  className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  whileHover={{ x: 2 }}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </motion.svg>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Theme Section */}
                    <div className="border-t border-white/10 pt-4">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                        Theme
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {themes.map((themeOption, index) => (
                          <motion.button
                            key={themeOption.value}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTheme(themeOption.value)}
                            className={`p-2.5 rounded-lg border transition-all duration-200 relative ${theme === themeOption.value
                                ? 'bg-blue-500/20 border-blue-400/50 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                              }`}
                          >
                            {theme === themeOption.value && (
                              <motion.div
                                layoutId="activeTheme"
                                className="absolute inset-0 bg-blue-500/10 border border-blue-400/30 rounded-lg"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                            <div className="relative mb-1">
                              <FontAwesomeIcon icon={themeOption.icon} className="w-4 h-4 icon-keep-color" />
                            </div>
                            <div className="relative text-xs font-medium">{themeOption.name}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Status Footer */}
                    <div className="border-t border-white/10 pt-3 mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                          <span>All systems operational</span>
                        </div>
                        <div className="text-gray-600">
                          v1.0.0
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              item.type === 'link' ? (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium text-sm lg:text-base"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                  >
                    {item.label}
                  </motion.div>
                </Link>
              ) : (
                <motion.button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium text-sm lg:text-base"
                >
                  {item.label}
                </motion.button>
              )
            ))}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative p-2 rounded-lg touch-manipulation"
            style={{ minHeight: '44px', minWidth: '44px', zIndex: 10001 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 mobile-menu-backdrop mobile-menu"
              style={{ zIndex: 9999 }}
            >

              {/* Menu Content */}
              <div className="flex flex-col items-center justify-center h-screen w-full px-8" style={{ zIndex: 10000 }}>
                {/* Logo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-16"
                >
                  <h1 className="text-5xl font-bold tracking-tight">
                    <span className="text-white">Sink</span>
                    <span className="text-blue-400">Dev</span>
                  </h1>
                </motion.div>

                {/* Navigation Items */}
                <nav className="flex flex-col items-center space-y-8 mb-16">
                  {navItems.map((item, index) => (
                    item.type === 'link' ? (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => handleNavClick(item)}
                        className="group py-3 touch-manipulation relative"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          <span className="text-3xl font-light text-white group-hover:text-gray-300 transition-colors duration-300">
                            {item.label}
                          </span>
                          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></div>
                        </motion.div>
                      </Link>
                    ) : (
                      <motion.button
                        key={item.href}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        onClick={() => handleNavClick(item)}
                        className="group py-3 touch-manipulation relative"
                      >
                        <span className="text-3xl font-light text-white group-hover:text-gray-300 transition-colors duration-300">
                          {item.label}
                        </span>
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></div>
                      </motion.button>
                    )
                  ))}
                </nav>

                {/* Social Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex space-x-4"
                >
                  <a
                    href="https://github.com/yuliitezarygml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center text-white touch-manipulation"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                  <a
                    href="https://discord.com/users/1256652881751441498/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center text-white touch-manipulation"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.197.372.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </a>
                  <a
                    href="https://t.me/yuliitezary"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center text-white touch-manipulation"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </a>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navigation;