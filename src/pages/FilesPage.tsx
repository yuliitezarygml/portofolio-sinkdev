import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFile,
  faFileImage,
  faFileVideo,
  faFileAudio,
  faFileCode,
  faFilePdf,
  faFileZipper,
  faDownload,
  faFolder,
  faEye,
  faArrowLeft,
  faChevronRight,
  faSearch,
  faX
} from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getFileSystemStats, getBreadcrumbs } from '../api/realTimeFileSystem';
import type { FileSystemItem } from '../api/realTimeFileSystem';
import { useRealTimeFiles } from '../hooks/useRealTimeFiles';
import FilePreview from '../components/FilePreview';

const FilesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Получаем текущий путь из URL
  const getCurrentPath = () => {
    const urlPath = location.pathname.replace('/files', '');
    return urlPath === '' ? '/' : urlPath;
  };

  const [currentPath, setCurrentPath] = useState(getCurrentPath());
  const { files, loading } = useRealTimeFiles(currentPath);
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allFiles, setAllFiles] = useState<FileSystemItem[]>([]);

  // Синхронизируем путь с URL
  useEffect(() => {
    const newPath = getCurrentPath();
    if (newPath !== currentPath) {
      setCurrentPath(newPath);
    }
  }, [location.pathname]);

  // Обновляем статистику при изменении файлов
  // useEffect(() => {
  //   if (files.length > 0) {
  //     setStats(getFileSystemStats(files));
  //   }
  // }, [files]);

  // Мемоизированная функция сканирования файлов
  const scanAllFiles = useCallback(async () => {
    const scannedFiles: FileSystemItem[] = [];

    const scanDirectory = async (path: string) => {
      try {
        const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
        if (!response.ok) return;

        const dirFiles = await response.json();

        for (const file of dirFiles) {
          scannedFiles.push(file);

          if (file.type === 'folder') {
            await scanDirectory(file.path);
          }
        }
      } catch (error) {
        console.error('Error scanning directory:', error);
      }
    };

    await scanDirectory('/');
    setAllFiles(scannedFiles);
  }, []);

  // Загружаем все файлы при первом заходе
  useEffect(() => {
    scanAllFiles();
  }, []);

  // Мемоизированная функция фильтрации файлов
  const getFilteredFiles = useMemo(() => {
    if (searchQuery) {
      // При поиске показываем только файлы, НЕ папки
      return allFiles.filter(file =>
        file.type === 'file' && (
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.extension?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      // Сортируем: папки сверху, потом файлы
      return [...files].sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
    }
  }, [searchQuery, allFiles, files]);

  const filteredFiles = getFilteredFiles;

  const handleFolderClick = (folderPath: string) => {
    const newUrl = folderPath === '/' ? '/files' : `/files${folderPath}`;
    navigate(newUrl);
  };

  const handleBreadcrumbClick = (path: string) => {
    const newUrl = path === '/' ? '/files' : `/files${path}`;
    navigate(newUrl);
  };

  const downloadFolder = async (folderPath: string) => {
    try {
      const url = `/api/download-folder?path=${encodeURIComponent(folderPath)}`;

      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading folder:', error);
    }
  };

  // const downloadAll = () => {
  //   try {
  //     const url = '/api/download-all';
  //     
  //     // Создаем временную ссылку для скачивания всех файлов
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.style.display = 'none';
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   } catch (error) {
  //     console.error('Error downloading all files:', error);
  //   }
  // };

  const openPreview = (file: FileSystemItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  const canPreview = (extension?: string): boolean => {
    if (!extension) return false;
    const previewableExtensions = [
      'txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'xml', 'yml', 'yaml', 'log',
      'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp',
      'pdf'
    ];
    return previewableExtensions.includes(extension.toLowerCase());
  };

  const getFileIcon = (extension?: string, type?: string) => {
    if (type === 'folder') return faFolder;

    if (!extension) return faFile;

    const ext = extension.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return faFileImage;
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext)) return faFileVideo;
    if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return faFileAudio;
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'sql', 'md', 'txt'].includes(ext)) return faFileCode;
    if (ext === 'pdf') return faFilePdf;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return faFileZipper;
    if (['exe', 'msi', 'dmg', 'app'].includes(ext)) return faFile;

    return faFile;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              SinkDev
            </Link>

            {/* Empty space for balance */}
            <div className="w-20"></div>
          </div>
        </nav>
      </motion.header>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container-custom">
          {/* Breadcrumbs Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                <FontAwesomeIcon icon={faFolder} className="text-gray-400 flex-shrink-0 icon-keep-color" />
                <div className="flex items-center gap-2 overflow-hidden">
                  {getBreadcrumbs(currentPath).map((crumb, index, array) => (
                    <div key={crumb.path} className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          handleBreadcrumbClick(crumb.path);
                          setSearchQuery('');
                        }}
                        className={`px-3 py-1 rounded transition-all duration-200 ${index === array.length - 1
                            ? 'text-white font-medium bg-white/10'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        {crumb.name === 'Files' ? 'Root' : crumb.name}
                      </button>
                      {index < array.length - 1 && (
                        <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-xs icon-keep-color" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm icon-keep-color"
                  />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 py-2 w-64 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faX} className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Files Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading files...</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Files List */}
              <div className="grid gap-3">
                {searchQuery && (
                  <div className="mb-4 text-sm text-gray-400">
                    Found {filteredFiles.length} files for "{searchQuery}"
                  </div>
                )}
                {filteredFiles.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: (index + 3) * 0.1
                    }}
                    className="group border border-white/10 rounded-lg p-4 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* File Info */}
                      <div
                        className={`flex items-center gap-4 flex-1 min-w-0 ${file.type === 'folder' && !searchQuery ? 'cursor-pointer' : ''
                          }`}
                        onClick={() => {
                          if (file.type === 'folder' && !searchQuery) {
                            handleFolderClick(file.path);
                          }
                        }}
                      >
                        <div className="flex-shrink-0">
                          <FontAwesomeIcon
                            icon={getFileIcon(file.extension, file.type)}
                            className={`text-2xl ${file.type === 'folder'
                                ? 'text-blue-400'
                                : 'text-gray-400'
                              }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base font-medium truncate mb-1 ${file.type === 'folder'
                              ? 'text-blue-300 hover:text-blue-200'
                              : 'text-white'
                            }`}>
                            {file.name}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatDate(file.uploadDate)}</span>
                            {file.type === 'folder' && file.fileCount !== undefined && (
                              <span>{file.fileCount} files</span>
                            )}
                            {file.size && (
                              <span>{formatFileSize(file.size)}</span>
                            )}
                            {file.extension && (
                              <span className="uppercase">{file.extension}</span>
                            )}
                            {searchQuery && file.path !== `/${file.name}` && (
                              <span className="text-blue-400 text-xs">📁 {file.path}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.type === 'file' && (
                          <>
                            {/* Preview button for previewable files */}
                            {canPreview(file.extension) && (
                              <button
                                onClick={() => openPreview(file)}
                                className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-manipulation"
                                style={{ minHeight: '36px', minWidth: '36px' }}
                                aria-label="Preview"
                              >
                                <FontAwesomeIcon icon={faEye} className="text-sm" />
                              </button>
                            )}

                            {/* HTML Preview in new tab */}
                            {(file.extension === 'html' || file.extension === 'htm') && (
                              <a
                                href={`/Files${file.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 transition-colors touch-manipulation"
                                style={{ minHeight: '36px', minWidth: '36px' }}
                                aria-label="Open HTML"
                                title="Open in new tab"
                              >
                                <FontAwesomeIcon icon={faEye} className="text-sm" />
                              </a>
                            )}

                            {/* Download button for all files */}
                            <a
                              href={`/Files${file.path}`}
                              download={file.name}
                              className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-manipulation"
                              style={{ minHeight: '36px', minWidth: '36px' }}
                              aria-label="Download"
                            >
                              <FontAwesomeIcon icon={faDownload} className="text-sm" />
                            </a>
                          </>
                        )}
                        {file.type === 'folder' && (
                          <button
                            onClick={() => downloadFolder(file.path)}
                            className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-manipulation"
                            style={{ minHeight: '36px', minWidth: '36px' }}
                            aria-label="Download folder"
                          >
                            <FontAwesomeIcon icon={faDownload} className="text-sm" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* File Preview Modal */}
      <FilePreview
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={closePreview}
      />
    </div>
  );
};

export default FilesPage;