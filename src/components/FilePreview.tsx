import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX, faDownload, faFileImage, faFileCode, faFilePdf, faCode } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { FileSystemItem } from '../api/realTimeFileSystem';

interface FilePreviewProps {
  file: FileSystemItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const FilePreview = ({ file, isOpen, onClose }: FilePreviewProps) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);

  // Check current theme
  useEffect(() => {
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('light-theme'));
    };
    
    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!file || !isOpen) {
      setContent('');
      setError(null);
      setShowSource(false);
      return;
    }

    loadFileContent();
  }, [file, isOpen]);

  const loadFileContent = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/Files${file.path}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.status}`);
      }

      // Для текстовых файлов, markdown, JSON и файлов с превью читаем как текст
      if (isTextFile(file.extension) || isMarkdownFile(file.extension) || isJsonFile(file.extension) || hasPreviewMode(file.extension)) {
        const text = await response.text();
        setContent(text);
      }
    } catch (err) {
      console.error('Error loading file:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const isTextFile = (extension?: string): boolean => {
    if (!extension) return false;
    const textExtensions = ['txt', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'xml', 'yml', 'yaml', 'log'];
    return textExtensions.includes(extension.toLowerCase());
  };

  const isMarkdownFile = (extension?: string): boolean => {
    return extension?.toLowerCase() === 'md';
  };

  const isJsonFile = (extension?: string): boolean => {
    return extension?.toLowerCase() === 'json';
  };

  const isImageFile = (extension?: string): boolean => {
    if (!extension) return false;
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
    return imageExtensions.includes(extension.toLowerCase());
  };

  const isPdfFile = (extension?: string): boolean => {
    return extension?.toLowerCase() === 'pdf';
  };

  const hasPreviewMode = (extension?: string): boolean => {
    return isMarkdownFile(extension) || isImageFile(extension) || isPdfFile(extension);
  };

  const getSourceContent = () => {
    if (!file || !content) return null;

    return (
      <div className="h-full flex flex-col">
        <SyntaxHighlighter
          language={isMarkdownFile(file.extension) ? 'markdown' : 'text'}
          style={isLightTheme ? vs : vscDarkPlus}
          className="h-full rounded-lg scrollable-code"
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '14px',
            lineHeight: '1.5',
            maxHeight: '100%'
          }}
          showLineNumbers={true}
          wrapLines={false}
          lineProps={(lineNumber) => ({
            style: {
              backgroundColor: lineNumber % 2 === 0 
                ? 'rgba(255, 255, 255, 0.04)' 
                : 'transparent',
              transition: 'background-color 0.15s ease',
              cursor: 'text',
              display: 'block',
              padding: '0'
            },
            onMouseEnter: (e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            },
            onMouseLeave: (e) => {
              e.target.style.backgroundColor = lineNumber % 2 === 0 
                ? 'rgba(255, 255, 255, 0.04)' 
                : 'transparent';
            }
          })}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    );
  };

  const getPreviewContent = () => {
    if (!file) return null;

    // Если показываем исходник для файлов с превью
    if (showSource && hasPreviewMode(file.extension)) {
      return getSourceContent();
    }

    if (isImageFile(file.extension)) {
      return (
        <div className="h-full overflow-auto flex items-center justify-center">
          <img 
            src={`/Files${file.path}`} 
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={(e) => setError('Failed to load image')}
          />
        </div>
      );
    }

    if (isPdfFile(file.extension)) {
      return (
        <div className="h-full overflow-hidden">
          <iframe 
            src={`/Files${file.path}`}
            className="w-full h-full rounded-lg border-0"
            title={file.name}
          />
        </div>
      );
    }

    if (isMarkdownFile(file.extension)) {
      return (
        <div className="h-full flex flex-col">
          <div 
            className="h-full p-6 bg-zinc-800/50 rounded-lg prose prose-invert prose-sm max-w-none"
            style={{
              overflow: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#9CA3AF #374151'
            }}
          >
            <ReactMarkdown
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={isLightTheme ? vs : vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-zinc-700 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
                h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-medium text-white mb-2 mt-4">{children}</h3>,
                p: ({children}) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="text-gray-300 mb-4 pl-6 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="text-gray-300 mb-4 pl-6 space-y-1">{children}</ol>,
                li: ({children}) => <li className="list-disc">{children}</li>,
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-500/10 rounded-r-lg mb-4 text-gray-300 italic">
                    {children}
                  </blockquote>
                ),
                strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                em: ({children}) => <em className="text-gray-200 italic">{children}</em>,
                a: ({children, href}) => (
                  <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    if (isJsonFile(file.extension)) {
      let formattedJson = content;
      try {
        const parsed = JSON.parse(content);
        formattedJson = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Если не удается распарсить, показываем как есть
      }

      return (
        <div className="h-full flex flex-col">
          <SyntaxHighlighter
            language="json"
            style={isLightTheme ? vs : vscDarkPlus}
            className="h-full rounded-lg scrollable-code"
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '14px',
              lineHeight: '1.5',
              maxHeight: '100%'
            }}
            showLineNumbers={true}
            wrapLines={false}
            lineProps={(lineNumber) => ({
              style: {
                backgroundColor: lineNumber % 2 === 0 
                  ? 'rgba(255, 255, 255, 0.04)' 
                  : 'transparent',
                transition: 'background-color 0.15s ease',
                cursor: 'text',
                display: 'block',
                padding: '0'
              },
              onMouseEnter: (e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              },
              onMouseLeave: (e) => {
                e.target.style.backgroundColor = lineNumber % 2 === 0 
                  ? 'rgba(255, 255, 255, 0.04)' 
                  : 'transparent';
              }
            })}
          >
            {formattedJson}
          </SyntaxHighlighter>
        </div>
      );
    }

    if (isTextFile(file.extension)) {
      const getLanguage = (ext?: string) => {
        const langMap: Record<string, string> = {
          'js': 'javascript',
          'ts': 'typescript',
          'tsx': 'tsx',
          'jsx': 'jsx',
          'py': 'python',
          'java': 'java',
          'cpp': 'cpp',
          'c': 'c',
          'html': 'html',
          'css': 'css',
          'xml': 'xml',
          'yml': 'yaml',
          'yaml': 'yaml'
        };
        return langMap[ext?.toLowerCase() || ''] || 'text';
      };

      const language = getLanguage(file.extension);

      if (language !== 'text') {
        return (
          <div className="h-full flex flex-col">
            <SyntaxHighlighter
              language={language}
              style={isLightTheme ? vs : vscDarkPlus}
              className="h-full rounded-lg scrollable-code"
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '14px',
                lineHeight: '1.5',
                maxHeight: '100%'
              }}
              showLineNumbers={true}
              wrapLines={false}
              lineProps={(lineNumber) => ({
                style: {
                  backgroundColor: lineNumber % 2 === 0 
                    ? 'rgba(255, 255, 255, 0.04)' 
                    : 'transparent',
                  transition: 'background-color 0.15s ease',
                  cursor: 'text',
                  display: 'block',
                  padding: '0'
                },
                onMouseEnter: (e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                },
                onMouseLeave: (e) => {
                  e.target.style.backgroundColor = lineNumber % 2 === 0 
                    ? 'rgba(255, 255, 255, 0.04)' 
                    : 'transparent';
                }
              })}
            >
              {content}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <div className="h-full flex flex-col">
          <div 
            className="h-full p-4 bg-black/50 rounded-lg text-sm text-gray-300 font-mono leading-relaxed relative"
            style={{
              overflow: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#9CA3AF #374151'
            }}
          >
            <div className="flex">
              <div className="flex-shrink-0 pr-4 text-gray-500 text-right select-none border-r border-gray-600 mr-4">
                {content.split('\n').map((_, index) => (
                  <div key={index} className="leading-relaxed">
                    {index + 1}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                {content.split('\n').map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap break-words leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <FontAwesomeIcon icon={faFileCode} className="text-4xl mb-4" />
          <p>Preview not available for this file type</p>
          <p className="text-sm mt-2">Extension: {file.extension}</p>
        </div>
      </div>
    );
  };

  const getFileIcon = () => {
    if (!file) return faFileCode;
    
    if (isImageFile(file.extension)) return faFileImage;
    if (isPdfFile(file.extension)) return faFilePdf;
    return faFileCode;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <style>{`
        .scrollable-code {
          overflow: auto !important;
          scrollbar-width: auto !important;
          scrollbar-color: #9CA3AF #374151 !important;
        }
        .scrollable-code::-webkit-scrollbar {
          width: 12px !important;
          height: 12px !important;
        }
        .scrollable-code::-webkit-scrollbar-track {
          background: #374151 !important;
          border-radius: 6px !important;
        }
        .scrollable-code::-webkit-scrollbar-thumb {
          background: #9CA3AF !important;
          border-radius: 6px !important;
          border: 2px solid #374151 !important;
        }
        .scrollable-code::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB !important;
        }
        .scrollable-code::-webkit-scrollbar-corner {
          background: #374151 !important;
        }
        
        /* VS Code стиль зебры для кода */
        .scrollable-code pre {
          background: transparent !important;
        }
        
        .scrollable-code code {
          background: transparent !important;
        }
        
        /* Для обычного текста - только hover без зебры */
        .text-line {
          padding: 2px 8px;
          margin: 0 -8px;
          transition: background-color 0.15s ease;
        }
        
        .text-line:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
      <AnimatePresence>
        {isOpen && file && (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-6xl h-[90vh] bg-zinc-900 rounded-xl border border-white/20 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={getFileIcon()} className="text-xl text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-white">{file.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {file.size && <span>{formatFileSize(file.size)}</span>}
                    {file.extension && <span className="uppercase">{file.extension}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Кнопка источника для файлов с превью */}
                {hasPreviewMode(file.extension) && (
                  <button
                    onClick={() => setShowSource(!showSource)}
                    className={`p-2 rounded-lg transition-colors ${
                      showSource 
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                    }`}
                    title={showSource ? "Show preview" : "Show source"}
                  >
                    <FontAwesomeIcon icon={faCode} />
                  </button>
                )}
                <a
                  href={`/Files${file.path}`}
                  download={file.name}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Download file"
                >
                  <FontAwesomeIcon icon={faDownload} />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faX} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Loading file...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-red-400">
                    <p className="text-lg mb-2">Error loading file</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              ) : (
                getPreviewContent()
              )}
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FilePreview;