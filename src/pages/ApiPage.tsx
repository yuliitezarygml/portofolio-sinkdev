import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCode, 
  faServer, 
  faArrowLeft, 
  faCopy, 
  faCheck, 
  faPlay,
  faFile,
  faFolder,
  faDownload,
  faSearch,
  faDatabase,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const ApiPage = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('filesystem');
  
  // Initialize theme from localStorage on component mount
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
  }, []);

  const tabs = [
    {
      id: 'filesystem',
      name: 'File System',
      icon: faFolder,
      description: 'File and folder management operations'
    },
    {
      id: 'system',
      name: 'System',
      icon: faCog,
      description: 'System information and utilities'
    },
    {
      id: 'database',
      name: 'Database',
      icon: faDatabase,
      description: 'Data management and queries'
    }
  ];

  const fileSystemEndpoints = [
    {
      method: 'GET',
      path: '/api/files',
      description: 'List files and folders in a directory',
      parameters: [
        { name: 'path', type: 'string', required: false, description: 'Directory path (default: root)' }
      ],
      response: {
        type: 'array',
        example: `[
  {
    "id": "file-1",
    "name": "example.txt",
    "type": "file",
    "path": "/example.txt",
    "size": 1024,
    "extension": "txt",
    "uploadDate": "2025-01-26T12:00:00.000Z"
  }
]`
      },
      icon: faFolder
    },
    {
      method: 'GET',
      path: '/api/download-folder',
      description: 'Download a folder as ZIP archive',
      parameters: [
        { name: 'path', type: 'string', required: true, description: 'Folder path to download' }
      ],
      response: {
        type: 'file',
        example: 'Returns ZIP file download'
      },
      icon: faDownload
    },
    {
      method: 'GET',
      path: '/Files/*',
      description: 'Direct file access and download',
      parameters: [
        { name: 'filepath', type: 'string', required: true, description: 'Full path to file' }
      ],
      response: {
        type: 'file',
        example: 'Returns file content or download'
      },
      icon: faFile
    }
  ];

  const systemEndpoints = [
    // Placeholder for future system endpoints
  ];

  const databaseEndpoints = [
    // Placeholder for future database endpoints
  ];

  const getCurrentEndpoints = () => {
    switch (activeTab) {
      case 'filesystem':
        return fileSystemEndpoints;
      case 'system':
        return systemEndpoints;
      case 'database':
        return databaseEndpoints;
      default:
        return fileSystemEndpoints;
    }
  };

  const copyToClipboard = async (text: string, endpoint: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(endpoint);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'POST': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'PUT': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'DELETE': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary">
      {/* Header with Navigation */}
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
            {/* Back Button */}
            <Link 
              to="/"
              className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="icon-keep-color" />
              <span className="font-medium">Back to Home</span>
            </Link>

            {/* Logo */}
            <Link to="/" className="text-xl md:text-2xl font-bold tracking-tight">
              SinkDev API
            </Link>

            {/* Empty space for balance */}
            <div className="w-20"></div>
          </div>
        </nav>
      </motion.header>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container-custom max-w-6xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-6">
              <FontAwesomeIcon icon={faServer} className="text-2xl text-blue-400 icon-keep-color" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              API Documentation
            </h1>
            <p className="text-xl text-theme-secondary max-w-3xl mx-auto leading-relaxed">
              RESTful API for file management and system operations. Built with Node.js and Express.
            </p>
          </motion.div>

          {/* Base URL Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                <FontAwesomeIcon icon={faCode} className="text-blue-400 icon-keep-color" />
                Base URL
              </h2>
              <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg border border-white/10">
                <code className="flex-1 text-green-400 font-mono">
                  {window.location.hostname === 'localhost' ? window.location.origin : 'https://SinkDev.eu'}
                </code>
                <button
                  onClick={() => copyToClipboard(window.location.hostname === 'localhost' ? window.location.origin : 'https://SinkDev.eu', 'base-url')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Copy base URL"
                >
                  <FontAwesomeIcon 
                    icon={copiedEndpoint === 'base-url' ? faCheck : faCopy} 
                    className="text-sm"
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tabs Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex flex-wrap gap-4 p-1 bg-white/5 rounded-xl border border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === 'filesystem' && setActiveTab(tab.id)}
                  disabled={tab.id !== 'filesystem'}
                  className={`flex-1 min-w-fit px-6 py-4 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                      : tab.id === 'filesystem' 
                        ? 'text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer'
                        : 'text-gray-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <FontAwesomeIcon icon={tab.icon} className="text-lg icon-keep-color" />
                    <span className="font-medium">{tab.name}</span>
                  </div>
                  <p className="text-xs opacity-80">
                    {tab.description}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* API Endpoints */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <FontAwesomeIcon icon={faSearch} className="text-blue-400 icon-keep-color" />
              {tabs.find(tab => tab.id === activeTab)?.name} Endpoints
            </h2>
            
            {getCurrentEndpoints().length > 0 ? (
              <div className="space-y-6">
                {getCurrentEndpoints().map((endpoint, index) => (
                <motion.div
                  key={`${endpoint.method}-${endpoint.path}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                >
                  {/* Endpoint Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={endpoint.icon} className="text-xl text-blue-400 icon-keep-color" />
                        <span className={`px-3 py-1 rounded-lg text-sm font-mono font-semibold border ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                      </div>
                      <code className="flex-1 text-lg font-mono text-white">
                        {endpoint.path}
                      </code>
                      <button
                        onClick={() => copyToClipboard(`${window.location.hostname === 'localhost' ? window.location.origin : 'https://SinkDev.eu'}${endpoint.path}`, endpoint.path)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Copy full URL"
                      >
                        <FontAwesomeIcon 
                          icon={copiedEndpoint === endpoint.path ? faCheck : faCopy} 
                          className="text-sm"
                        />
                      </button>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {endpoint.description}
                    </p>
                  </div>

                  {/* Endpoint Details */}
                  <div className="p-6 space-y-6">
                    {/* Parameters */}
                    {endpoint.parameters.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Parameters</h4>
                        <div className="space-y-3">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="flex items-center gap-4 p-3 bg-black/20 rounded-lg">
                              <code className="font-mono text-blue-400 min-w-fit">
                                {param.name}
                              </code>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                param.required 
                                  ? 'bg-red-400/20 text-red-400 border border-red-400/30' 
                                  : 'bg-gray-400/20 text-gray-400 border border-gray-400/30'
                              }`}>
                                {param.required ? 'required' : 'optional'}
                              </span>
                              <span className="text-gray-400 text-sm">
                                {param.type}
                              </span>
                              <span className="text-gray-300 text-sm">
                                {param.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Response</h4>
                      <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-400">
                            Type: <code className="text-green-400">{endpoint.response.type}</code>
                          </span>
                          <button
                            onClick={() => copyToClipboard(endpoint.response.example, `${endpoint.path}-response`)}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Copy response example"
                          >
                            <FontAwesomeIcon 
                              icon={copiedEndpoint === `${endpoint.path}-response` ? faCheck : faCopy} 
                              className="text-xs"
                            />
                          </button>
                        </div>
                        <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                          {endpoint.response.example}
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-500/20 rounded-2xl mb-6">
                  <FontAwesomeIcon icon={faCog} className="text-2xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Coming Soon
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  {tabs.find(tab => tab.id === activeTab)?.name} endpoints are currently in development. 
                  Check back later for updates!
                </p>
              </div>
            )}
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Need Help?
              </h3>
              <p className="text-gray-400 mb-4">
                This API is part of the SinkDev portfolio project. For questions or support, feel free to reach out.
              </p>
              <Link 
                to="/#contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 font-medium"
              >
                <FontAwesomeIcon icon={faCode} />
                Contact Developer
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ApiPage;