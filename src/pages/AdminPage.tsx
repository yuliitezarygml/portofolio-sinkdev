import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShield,
  faArrowLeft,
  faEye,
  faEyeSlash,
  faLock,
  faUser,
  faKey,
  faServer,
  faChartLine,
  faDatabase,
  faCog,
  faUsers,
  faFileAlt,
  faDownload,
  faTrash,
  faEdit,
  faPlus,
  faRefresh,
  faFolder,
  faFile
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import FilePreview from '../components/FilePreview';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Check for existing session on load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    const root = document.documentElement;

    if (savedTheme === 'white') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else if (savedTheme === 'black') {
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

    // Check for existing admin session
    const adminSession = localStorage.getItem('admin-session');
    if (adminSession) {
      const sessionTime = parseInt(adminSession);
      const currentTime = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

      if (currentTime - sessionTime < twelveHours) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('admin-session');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication with secure hash checking
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Hash credentials (fallback for non-HTTPS contexts)
    const hashCredentials = async (text: string) => {
      // Check if crypto.subtle is available (HTTPS or localhost)
      if (window.crypto && window.crypto.subtle) {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(text);
          const hash = await crypto.subtle.digest('SHA-256', data);
          return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
          console.warn('crypto.subtle failed, using fallback hash');
        }
      }

      // Fallback simple hash for HTTP contexts (NOT SECURE - for development only)
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16).padStart(8, '0');
    };

    const expectedUserHash = await hashCredentials('yuliitezary');
    const expectedPassHash = await hashCredentials('SinkDev.');
    const userHash = await hashCredentials(loginData.username.toLowerCase());
    const passHash = await hashCredentials(loginData.password);

    if (userHash === expectedUserHash && passHash === expectedPassHash) {
      setIsAuthenticated(true);
      localStorage.setItem('admin-session', Date.now().toString());
    } else {
      alert('Invalid credentials. Access denied.');
    }

    setIsLoading(false);
  };

  const sidebarItems = [
    { id: 'overview', name: 'Overview', icon: faChartLine },
    { id: 'analytics', name: 'Analytics', icon: faChartLine },
    { id: 'logs', name: 'Request Logs', icon: faFileAlt },
    { id: 'system-logs', name: 'System Logs', icon: faServer },
    { id: 'files', name: 'File Manager', icon: faFolder }
  ];

  const [systemStats, setSystemStats] = useState({
    cpuUsage: '0%',
    memoryUsage: '0%',
    diskUsage: '0%',
    uptime: '0h 0m',
    platform: 'Unknown',
    nodeVersion: 'Unknown',
    hostname: 'Unknown',
    architecture: 'Unknown',
    cores: 0,
    totalMemory: '0 MB',
    freeMemory: '0 MB'
  });

  const [requestLogs, setRequestLogs] = useState<Array<{
    id: string;
    timestamp: string;
    method: string;
    url: string;
    ip: string;
    userAgent: string;
    status?: number;
    responseTime?: number;
    host?: string;
    referer?: string;
    contentType?: string;
    protocol?: string;
    responseSize?: number;
    type?: 'download' | 'api' | 'page';
    fileName?: string;
    fileType?: string;
    apiEndpoint?: string;
  }>>([]);

  // File manager state
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
    fileCount?: number;
    uploadDate: string;
    extension?: string;
    path: string;
    parentPath: string;
  }>>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRename, setShowRename] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);


  // Fetch system statistics
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const response = await fetch('/api/system-stats');
        if (response.ok) {
          const data = await response.json();
          setSystemStats({
            cpuUsage: data.cpu.usage,
            memoryUsage: `${data.memory.percentage}%`,
            diskUsage: data.disk.percentage,
            uptime: data.uptime,
            platform: data.platform,
            nodeVersion: data.nodeVersion,
            hostname: data.hostname,
            architecture: data.architecture,
            cores: data.cpu.cores,
            totalMemory: data.memory.total,
            freeMemory: data.memory.free
          });
        } else {
          // Fallback to client-side stats if API is unavailable
          const fallbackStats = {
            cpuUsage: 'N/A',
            memoryUsage: 'N/A',
            diskUsage: 'N/A',
            uptime: 'N/A',
            platform: navigator.platform,
            nodeVersion: 'Unknown'
          };
          setSystemStats(fallbackStats);
        }
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
        // Fallback stats
        const fallbackStats = {
          cpuUsage: 'N/A',
          memoryUsage: 'N/A',
          diskUsage: 'N/A',
          uptime: 'N/A',
          platform: navigator.platform,
          nodeVersion: 'Unknown'
        };
        setSystemStats(fallbackStats);
      }
    };

    if (isAuthenticated) {
      fetchSystemStats();
      const interval = setInterval(fetchSystemStats, 2000); // Update every 2 seconds for real-time feel
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Fetch request logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Try Express server first (port 3001), then fallback to Vite dev server
        let response;
        try {
          response = await fetch('http://localhost:3001/api/request-logs');
        } catch {
          response = await fetch('/api/request-logs');
        }

        if (response.ok) {
          const logs = await response.json();
          setRequestLogs(logs.slice(0, 50)); // Keep only last 50 logs
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };

    if (isAuthenticated) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000); // Update every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Fetch files for file manager
  useEffect(() => {
    const fetchFiles = async () => {
      if (!isAuthenticated || activeSection !== 'files') return;

      try {
        const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
        if (response.ok) {
          const fileList = await response.json();
          setFiles(fileList);
        }
      } catch (error) {
        console.error('Failed to fetch files:', error);
      }
    };

    fetchFiles();
  }, [isAuthenticated, activeSection, currentPath]);

  // File management functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          // Refresh file list
          const filesResponse = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
          if (filesResponse.ok) {
            const fileList = await filesResponse.json();
            setFiles(fileList);
          }
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Error uploading ${file.name}`);
      }
    }

    setIsUploading(false);
    event.target.value = ''; // Reset input
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          name: newFolderName.trim()
        })
      });

      if (response.ok) {
        setNewFolderName('');
        setShowCreateFolder(false);
        // Refresh file list
        const filesResponse = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
        if (filesResponse.ok) {
          const fileList = await filesResponse.json();
          setFiles(fileList);
        }
      } else {
        alert('Failed to create folder');
      }
    } catch (error) {
      console.error('Create folder error:', error);
      alert('Error creating folder');
    }
  };

  const handleDeleteFiles = async () => {
    if (selectedFiles.length === 0) return;

    if (!confirm(`Delete ${selectedFiles.length} selected item(s)?`)) return;

    try {
      for (const filePath of selectedFiles) {
        const response = await fetch('/api/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: filePath })
        });

        if (!response.ok) {
          alert(`Failed to delete ${filePath}`);
        }
      }

      setSelectedFiles([]);
      // Refresh file list
      const filesResponse = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
      if (filesResponse.ok) {
        const fileList = await filesResponse.json();
        setFiles(fileList);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting files');
    }
  };

  const handleRename = async (filePath: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      const response = await fetch('/api/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPath: filePath,
          newName: newName.trim()
        })
      });

      if (response.ok) {
        setShowRename(null);
        setRenameValue('');
        // Refresh file list
        const filesResponse = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
        if (filesResponse.ok) {
          const fileList = await filesResponse.json();
          setFiles(fileList);
        }
      } else {
        alert('Failed to rename file');
      }
    } catch (error) {
      console.error('Rename error:', error);
      alert('Error renaming file');
    }
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]);
  };


  const stats = [
    { label: 'CPU Usage', value: systemStats.cpuUsage, icon: faServer, color: 'text-blue-400' },
    { label: 'Memory Usage', value: systemStats.memoryUsage, icon: faDatabase, color: 'text-green-400' },
    { label: 'Disk Usage', value: systemStats.diskUsage, icon: faFileAlt, color: 'text-orange-400' },
    { label: 'Uptime', value: systemStats.uptime, icon: faChartLine, color: 'text-purple-400' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-theme-primary text-theme-primary flex items-center justify-center">
        {/* Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-40"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
            backdropFilter: 'blur(40px) saturate(200%) brightness(110%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(110%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <nav className="container-custom">
            <div className="flex items-center justify-between h-16 md:h-20">
              <Link
                to="/"
                className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="icon-keep-color" />
                <span className="font-medium">Back to Home</span>
              </Link>

              <div className="text-xl md:text-2xl font-bold tracking-tight">
                <span className="gradient-text">SinkDev</span>
              </div>

              <div className="w-20"></div>
            </div>
          </nav>
        </motion.header>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md p-8"
        >
          <div className="bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
                <FontAwesomeIcon icon={faLock} className="text-2xl text-gray-300 icon-keep-color" />
              </div>
              <h1 className="text-2xl font-bold gradient-text mb-2">
                SinkDev Access
              </h1>
              <p className="text-gray-400">
                Enter your credentials to access the dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faKey} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-white text-black font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-gray-100"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faShield} />
                    Access Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-500/10 border border-gray-400/20 rounded-lg">
              <p className="text-xs text-gray-400 text-center">
                Authorized personnel only. All access is logged and monitored.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          backdropFilter: 'blur(40px) saturate(200%) brightness(110%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(110%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <nav className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link
              to="/"
              className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="icon-keep-color" />
              <span className="font-medium">Back to Home</span>
            </Link>

            <div className="text-xl md:text-2xl font-bold tracking-tight">
              <span className="gradient-text">SinkDev</span>
            </div>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                localStorage.removeItem('admin-session');
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </nav>
      </motion.header>

      <div className="flex pt-20">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-64 h-screen bg-white/5 border-r border-white/10 p-6 fixed left-0 top-20"
        >
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeSection === item.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <FontAwesomeIcon icon={item.icon} className="icon-keep-color" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {activeSection === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold gradient-text mb-8">System Overview</h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white/5 rounded-xl border border-white/10 p-6 relative overflow-hidden"
                  >
                    {/* Animated background pulse */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
                      animate={{
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <FontAwesomeIcon icon={stat.icon} className={`text-2xl ${stat.color} icon-keep-color`} />
                        <div className="flex items-center gap-2">
                          {/* Live indicator */}
                          <motion.div
                            className="w-2 h-2 bg-green-400 rounded-full"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          <span className="text-xs text-gray-400">Live</span>
                        </div>
                      </div>

                      {/* Animated value with key to trigger re-render */}
                      <AnimatePresence mode="wait">
                        <motion.h3
                          key={stat.value}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3 }}
                          className="text-2xl font-bold text-white mb-1"
                        >
                          {stat.value}
                        </motion.h3>
                      </AnimatePresence>

                      <p className="text-gray-400 text-sm">{stat.label}</p>

                      {/* Progress bar for percentage values */}
                      {stat.value.includes('%') && (
                        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${stat.label.includes('CPU') ? 'bg-blue-400' :
                              stat.label.includes('Memory') ? 'bg-green-400' :
                                stat.label.includes('Disk') ? 'bg-orange-400' :
                                  'bg-purple-400'
                              }`}
                            initial={{ width: 0 }}
                            animate={{
                              width: stat.value.replace('%', '') + '%'
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* System Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Server Information</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Hostname</span>
                      <span className="text-white font-mono text-sm">{systemStats.hostname}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Platform</span>
                      <span className="text-white font-mono text-sm">{systemStats.platform}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Architecture</span>
                      <span className="text-white font-mono">{systemStats.architecture}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Node.js</span>
                      <span className="text-white font-mono">{systemStats.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">CPU Cores</span>
                      <span className="text-white font-mono">{systemStats.cores}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Memory Details</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Memory</span>
                      <span className="text-white font-mono">{systemStats.totalMemory}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Free Memory</span>
                      <span className="text-green-400 font-mono">{systemStats.freeMemory}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Used Memory</span>
                      <span className="text-orange-400 font-mono">{systemStats.memoryUsage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Uptime</span>
                      <span className="text-blue-400 font-mono">{systemStats.uptime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Environment</span>
                      <span className="text-green-400 font-mono">Production</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (isAuthenticated) {
                          window.location.reload();
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-white"
                    >
                      <FontAwesomeIcon icon={faRefresh} className="icon-keep-color" />
                      <span>Refresh Dashboard</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('logs')}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-white"
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="icon-keep-color" />
                      <span>View Request Logs</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-white">
                      <FontAwesomeIcon icon={faDownload} className="icon-keep-color" />
                      <span>Export System Data</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold gradient-text mb-8">Google Analytics Dashboard</h1>

              {/* GA Info Card */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faChartLine} className="text-2xl text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Connected to Google Analytics</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">
                        <span className="text-gray-400">Property:</span> <span className="font-mono">sinkdev.dev</span>
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-400">Measurement ID:</span> <span className="font-mono">G-49WK1FFZ80</span>
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-400">Stream ID:</span> <span className="font-mono">13038005735</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">Active</span>
                  </div>
                </div>
              </div>

              {/* Real-time Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 text-sm">Active Users</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {requestLogs.filter(log => {
                      const logTime = new Date(log.timestamp).getTime();
                      const now = Date.now();
                      return (now - logTime) < 300000; // Last 5 minutes
                    }).length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Last 5 minutes</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Page Views</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {requestLogs.filter(log => log.type === 'page').length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total views</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Unique IPs</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {new Set(requestLogs.map(log => log.ip)).size}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Visitors</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Avg Session</span>
                  </div>
                  <div className="text-2xl font-bold text-white">2m 34s</div>
                  <p className="text-xs text-gray-500 mt-1">Duration</p>
                </div>
              </div>

              {/* Popular Pages & Traffic Sources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Popular Pages */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Popular Pages</h3>
                  <div className="space-y-3">
                    {(() => {
                      const pageCounts = requestLogs
                        .filter(log => log.type === 'page')
                        .reduce((acc, log) => {
                          const page = log.url.split('?')[0];
                          acc[page] = (acc[page] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                      return Object.entries(pageCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([page, count], index) => (
                          <div key={page} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>
                              <span className="text-white font-mono text-sm">{page || '/'}</span>
                            </div>
                            <span className="text-blue-400 font-semibold">{count}</span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
                  <div className="space-y-3">
                    {(() => {
                      const sources = requestLogs
                        .filter(log => log.referer && log.referer !== '-')
                        .reduce((acc, log) => {
                          try {
                            const url = new URL(log.referer!);
                            const source = url.hostname;
                            acc[source] = (acc[source] || 0) + 1;
                          } catch {
                            acc['Direct'] = (acc['Direct'] || 0) + 1;
                          }
                          return acc;
                        }, { 'Direct': requestLogs.filter(log => !log.referer || log.referer === '-').length } as Record<string, number>);

                      return Object.entries(sources)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([source, count]) => {
                          const total = requestLogs.length;
                          const percentage = ((count / total) * 100).toFixed(1);
                          return (
                            <div key={source} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white text-sm">{source}</span>
                                <span className="text-gray-400 text-sm">{percentage}%</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        });
                    })()}
                  </div>
                </div>
              </div>

              {/* Device & Browser Stats */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Operating Systems</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {(() => {
                    const operatingSystems = requestLogs.reduce((acc, log) => {
                      const ua = log.userAgent.toLowerCase();
                      let os = 'Other';

                      if (ua.includes('windows')) {
                        os = 'Windows';
                      } else if (ua.includes('mac os') || ua.includes('macos') || ua.includes('macintosh')) {
                        os = 'macOS';
                      } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
                        os = 'iOS';
                      } else if (ua.includes('android')) {
                        os = 'Android';
                      } else if (ua.includes('linux')) {
                        os = 'Linux';
                      }

                      acc[os] = (acc[os] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    const getOSIcon = (os: string) => {
                      switch (os) {
                        case 'Windows': return '🪟';
                        case 'macOS': return '🍎';
                        case 'iOS': return '📱';
                        case 'Android': return '🤖';
                        case 'Linux': return '🐧';
                        default: return '💻';
                      }
                    };

                    return Object.entries(operatingSystems)
                      .sort(([, a], [, b]) => b - a)
                      .map(([os, count]) => {
                        const total = requestLogs.length;
                        const percentage = ((count / total) * 100).toFixed(1);
                        return (
                          <div key={os} className="bg-white/5 rounded-lg p-4 text-center">
                            <div className="text-3xl mb-2">{getOSIcon(os)}</div>
                            <div className="text-2xl font-bold text-white mb-1">{percentage}%</div>
                            <div className="text-sm text-gray-400">{os}</div>
                            <div className="text-xs text-gray-500 mt-1">{count} visits</div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>

              {/* Browser Stats */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Browsers</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {(() => {
                    const browsers = requestLogs.reduce((acc, log) => {
                      const ua = log.userAgent.toLowerCase();
                      let browser = 'Other';

                      // Порядок проверки важен! Сначала более специфичные
                      if (ua.includes('edg/') || ua.includes('edge')) {
                        browser = 'Edge';
                      } else if (ua.includes('opr/') || ua.includes('opera')) {
                        browser = 'Opera';
                      } else if (ua.includes('chrome') && !ua.includes('edg')) {
                        browser = 'Chrome';
                      } else if (ua.includes('firefox')) {
                        browser = 'Firefox';
                      } else if (ua.includes('safari') && !ua.includes('chrome')) {
                        browser = 'Safari';
                      } else if (ua.includes('msie') || ua.includes('trident')) {
                        browser = 'IE';
                      }

                      acc[browser] = (acc[browser] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    const getBrowserIcon = (browser: string) => {
                      switch (browser) {
                        case 'Chrome': return '🌐';
                        case 'Firefox': return '🦊';
                        case 'Safari': return '🧭';
                        case 'Edge': return '🌊';
                        case 'Opera': return '🎭';
                        case 'IE': return '📜';
                        default: return '🌍';
                      }
                    };

                    const getBrowserColor = (browser: string) => {
                      switch (browser) {
                        case 'Chrome': return 'from-yellow-500 to-red-500';
                        case 'Firefox': return 'from-orange-500 to-red-500';
                        case 'Safari': return 'from-blue-400 to-cyan-400';
                        case 'Edge': return 'from-blue-500 to-green-500';
                        case 'Opera': return 'from-red-500 to-pink-500';
                        default: return 'from-gray-500 to-gray-600';
                      }
                    };

                    return Object.entries(browsers)
                      .sort(([, a], [, b]) => b - a)
                      .map(([browser, count]) => {
                        const total = requestLogs.length;
                        const percentage = ((count / total) * 100).toFixed(1);
                        return (
                          <div key={browser} className="bg-white/5 rounded-lg p-4 text-center relative overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-br ${getBrowserColor(browser)} opacity-10`}></div>
                            <div className="relative z-10">
                              <div className="text-3xl mb-2">{getBrowserIcon(browser)}</div>
                              <div className="text-2xl font-bold text-white mb-1">{percentage}%</div>
                              <div className="text-sm text-gray-400">{browser}</div>
                              <div className="text-xs text-gray-500 mt-1">{count} visits</div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'logs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold gradient-text mb-8">Request Logs & Analytics</h1>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Total Requests</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{requestLogs.length}</div>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">File Downloads</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {requestLogs.filter(log => log.type === 'download').length}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">API Calls</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {requestLogs.filter(log => log.type === 'api').length}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Avg Response</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {requestLogs.length > 0
                      ? Math.round(requestLogs.reduce((acc, log) => acc + (log.responseTime || 0), 0) / requestLogs.length)
                      : 0}ms
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live monitoring
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-3 text-gray-400 font-medium min-w-[80px]">Time</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium min-w-[60px]">Type</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium min-w-[60px]">Method</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium min-w-[250px]">Resource</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium min-w-[100px]">IP Address</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium min-w-[60px]">Status</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium min-w-[80px]">Response</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium min-w-[80px]">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestLogs.length > 0 ? requestLogs.slice(0, 100).map((log) => (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${log.type === 'download' ? 'bg-green-500/20 text-green-400' :
                              log.type === 'api' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                              {log.type === 'download' ? '📥 File' : log.type === 'api' ? '🔌 API' : '📄 Page'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs font-mono ${log.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                              log.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                                log.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                                  log.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                                    'bg-gray-500/20 text-gray-400'
                              }`}>
                              {log.method}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-white text-xs">
                            {log.type === 'download' && log.fileName ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-green-400">{log.fileName}</span>
                                {log.fileType && (
                                  <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs text-gray-400">
                                    .{log.fileType}
                                  </span>
                                )}
                              </div>
                            ) : log.type === 'api' && log.apiEndpoint ? (
                              <span className="font-mono text-purple-400">{log.apiEndpoint}</span>
                            ) : (
                              <span className="font-mono text-gray-400 truncate max-w-[200px] inline-block" title={log.url}>
                                {log.url}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs">
                            {log.ip}
                          </td>
                          <td className="py-2 px-3">
                            {log.status && (
                              <span className={`px-2 py-1 rounded text-xs font-mono ${log.status >= 200 && log.status < 300 ? 'bg-green-500/20 text-green-400' :
                                log.status >= 300 && log.status < 400 ? 'bg-yellow-500/20 text-yellow-400' :
                                  log.status >= 400 ? 'bg-red-500/20 text-red-400' :
                                    'bg-gray-500/20 text-gray-400'
                                }`}>
                                {log.status}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs">
                            {log.responseTime ? `${log.responseTime}ms` : '-'}
                          </td>
                          <td className="py-2 px-3 text-gray-300 text-xs">
                            {log.responseSize ? (
                              log.responseSize > 1024 * 1024
                                ? `${(log.responseSize / 1024 / 1024).toFixed(2)} MB`
                                : log.responseSize > 1024
                                  ? `${(log.responseSize / 1024).toFixed(2)} KB`
                                  : `${log.responseSize} B`
                            ) : '-'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">
                            No request logs available yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {requestLogs.length > 0 && (
                  <div className="mt-4 text-sm text-gray-400 text-center">
                    Showing last {requestLogs.length} requests • Updates every 3 seconds
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'files' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold gradient-text mb-8">File Manager</h1>

              {/* File Manager Controls */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {/* Breadcrumb Navigation */}
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => navigateToPath('/')}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Root
                      </button>
                      {currentPath !== '/' && (
                        <>
                          {currentPath.split('/').filter(Boolean).map((segment, index, array) => {
                            const path = '/' + array.slice(0, index + 1).join('/');
                            return (
                              <div key={path} className="flex items-center gap-2">
                                <span className="text-gray-400">/</span>
                                <button
                                  onClick={() => navigateToPath(path)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  {segment}
                                </button>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {selectedFiles.length > 0 && (
                      <button
                        onClick={handleDeleteFiles}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-400/30 transition-all duration-200 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete ({selectedFiles.length})
                      </button>
                    )}

                    <button
                      onClick={() => setShowCreateFolder(true)}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-400/30 transition-all duration-200 flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      New Folder
                    </button>

                    <label className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-400/30 transition-all duration-200 flex items-center gap-2 cursor-pointer">
                      <FontAwesomeIcon icon={faPlus} />
                      {isUploading ? 'Uploading...' : 'Upload Files'}
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>

                    <button
                      onClick={() => {
                        const response = fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
                        response.then(res => res.json()).then(setFiles);
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all duration-200"
                    >
                      <FontAwesomeIcon icon={faRefresh} />
                    </button>
                  </div>
                </div>

                {/* Create Folder Modal */}
                {showCreateFolder && (
                  <div className="mb-4 p-4 bg-white/10 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                        autoFocus
                      />
                      <button
                        onClick={handleCreateFolder}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30 hover:bg-blue-500/30 transition-all"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateFolder(false);
                          setNewFolderName('');
                        }}
                        className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg border border-gray-400/30 hover:bg-gray-500/30 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* File List */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium w-12">
                          <input
                            type="checkbox"
                            checked={selectedFiles.length === files.length && files.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFiles(files.map(f => f.path));
                              } else {
                                setSelectedFiles([]);
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Size</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Modified</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Back to parent directory */}
                      {currentPath !== '/' && (
                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
                                navigateToPath(parentPath);
                              }}
                              className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <FontAwesomeIcon icon={faArrowLeft} />
                              <span>.. (Back)</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-gray-400">-</td>
                          <td className="py-3 px-4 text-gray-400">-</td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      )}

                      {/* Files and folders */}
                      {files.map((file) => (
                        <tr key={file.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.path)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFiles([...selectedFiles, file.path]);
                                } else {
                                  setSelectedFiles(selectedFiles.filter(p => p !== file.path));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="py-3 px-4">
                            {showRename === file.path ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRename(file.path, renameValue);
                                    } else if (e.key === 'Escape') {
                                      setShowRename(null);
                                      setRenameValue('');
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRename(file.path, renameValue)}
                                  className="text-green-400 hover:text-green-300"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setShowRename(null);
                                    setRenameValue('');
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <FontAwesomeIcon
                                  icon={file.type === 'folder' ? faFolder : faFile}
                                  className={file.type === 'folder' ? 'text-blue-400' : 'text-gray-400'}
                                />
                                {file.type === 'folder' ? (
                                  <button
                                    onClick={() => navigateToPath(file.path)}
                                    className="text-white hover:text-blue-400 transition-colors"
                                  >
                                    {file.name}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedFileForPreview(file);
                                      setIsPreviewOpen(true);
                                    }}
                                    className="text-white hover:text-blue-400 transition-colors cursor-pointer"
                                  >
                                    {file.name}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-sm">
                            {file.type === 'folder' ?
                              (file.fileCount !== undefined ? `${file.fileCount} items` : '-') :
                              formatFileSize(file.size)
                            }
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-sm">
                            {new Date(file.uploadDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setShowRename(file.path);
                                  setRenameValue(file.name);
                                }}
                                className="text-gray-400 hover:text-blue-400 transition-colors"
                                title="Rename"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>

                              {/* HTML Preview Button */}
                              {file.type === 'file' && (file.extension === 'html' || file.extension === 'htm') && (
                                <a
                                  href={`/Files${file.path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-purple-400 transition-colors"
                                  title="Preview HTML"
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </a>
                              )}

                              {file.type === 'file' && (
                                <a
                                  href={`/Files${file.path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-green-400 transition-colors"
                                  title="Download"
                                >
                                  <FontAwesomeIcon icon={faDownload} />
                                </a>
                              )}
                              {file.type === 'folder' && (
                                <a
                                  href={`/api/download-folder?path=${encodeURIComponent(file.path)}`}
                                  className="text-gray-400 hover:text-green-400 transition-colors"
                                  title="Download as ZIP"
                                >
                                  <FontAwesomeIcon icon={faDownload} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {files.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            No files in this directory
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'system-logs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold gradient-text mb-8">System Logs</h1>

              {/* System Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 text-sm">System Status</span>
                  </div>
                  <div className="text-xl font-bold text-green-400">Online</div>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Platform</span>
                  </div>
                  <div className="text-xl font-bold text-white">{systemStats.platform}</div>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Node Version</span>
                  </div>
                  <div className="text-xl font-bold text-white">{systemStats.nodeVersion}</div>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Uptime</span>
                  </div>
                  <div className="text-xl font-bold text-white">{systemStats.uptime}</div>
                </div>
              </div>

              {/* Console-style Logs */}
              <div className="bg-black/50 rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-sm text-gray-400 ml-3 font-mono">system.log</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live
                  </div>
                </div>

                <div className="p-4 font-mono text-sm max-h-[600px] overflow-y-auto" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#9CA3AF #374151'
                }}>
                  {/* System Logs */}
                  {requestLogs.slice(0, 50).map((log, index) => {
                    const logTime = new Date(log.timestamp);
                    const logLevel = log.status && log.status >= 400 ? 'ERROR' : log.status && log.status >= 300 ? 'WARN' : 'INFO';
                    const logColor = logLevel === 'ERROR' ? 'text-red-400' : logLevel === 'WARN' ? 'text-yellow-400' : 'text-green-400';

                    return (
                      <div key={log.id} className="mb-1 hover:bg-white/5 px-2 py-1 rounded transition-colors">
                        <span className="text-gray-500">[{logTime.toLocaleTimeString()}]</span>
                        {' '}
                        <span className={`${logColor} font-semibold`}>[{logLevel}]</span>
                        {' '}
                        <span className="text-gray-400">{log.method}</span>
                        {' '}
                        <span className="text-white">{log.url}</span>
                        {' '}
                        {log.status && (
                          <>
                            <span className="text-gray-500">-</span>
                            {' '}
                            <span className={log.status >= 400 ? 'text-red-400' : log.status >= 300 ? 'text-yellow-400' : 'text-green-400'}>
                              {log.status}
                            </span>
                          </>
                        )}
                        {log.responseTime && (
                          <>
                            {' '}
                            <span className="text-gray-500">({log.responseTime}ms)</span>
                          </>
                        )}
                        {' '}
                        <span className="text-blue-400">{log.ip}</span>
                      </div>
                    );
                  })}

                  {requestLogs.length === 0 && (
                    <div className="text-gray-500 text-center py-8">
                      No system logs available yet
                    </div>
                  )}
                </div>

                {requestLogs.length > 0 && (
                  <div className="bg-white/5 border-t border-white/10 px-4 py-2 text-xs text-gray-500 font-mono">
                    Showing {Math.min(50, requestLogs.length)} of {requestLogs.length} log entries
                  </div>
                )}
              </div>

              {/* Log Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Success Rate</span>
                    <span className="text-green-400 text-xs font-mono">2xx</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {requestLogs.length > 0
                      ? ((requestLogs.filter(log => log.status && log.status >= 200 && log.status < 300).length / requestLogs.length) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {requestLogs.filter(log => log.status && log.status >= 200 && log.status < 300).length} requests
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Errors</span>
                    <span className="text-red-400 text-xs font-mono">4xx/5xx</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {requestLogs.filter(log => log.status && log.status >= 400).length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {requestLogs.length > 0
                      ? ((requestLogs.filter(log => log.status && log.status >= 400).length / requestLogs.length) * 100).toFixed(1)
                      : 0}% error rate
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Avg Response</span>
                    <span className="text-blue-400 text-xs font-mono">ms</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {requestLogs.length > 0
                      ? Math.round(requestLogs.reduce((acc, log) => acc + (log.responseTime || 0), 0) / requestLogs.length)
                      : 0}ms
                  </div>
                  <div className="text-xs text-gray-500">
                    across {requestLogs.length} requests
                  </div>
                </div>
              </div>
            </motion.div>
          )}


        </main>
      </div>

      {/* File Preview Modal */}
      <FilePreview
        file={selectedFileForPreview}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedFileForPreview(null);
        }}
      />
    </div>
  );
};

export default AdminPage;