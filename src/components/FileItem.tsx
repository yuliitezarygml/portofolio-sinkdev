import { memo } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faEye } from '@fortawesome/free-solid-svg-icons';
import type { FileSystemItem } from '../api/realTimeFileSystem';
import { getOptimizedVariants } from '../utils/animations';

interface FileItemProps {
  file: FileSystemItem;
  index: number;
  searchQuery: string;
  onFolderClick: (path: string) => void;
  onPreview: (file: FileSystemItem) => void;
  canPreview: (extension?: string) => boolean;
  getFileIcon: (extension?: string, type?: string) => any;
  formatFileSize: (bytes?: number) => string;
  formatDate: (dateString: string) => string;
}

const FileItem = memo(({
  file,
  index,
  searchQuery,
  onFolderClick,
  onPreview,
  canPreview,
  getFileIcon,
  formatFileSize,
  formatDate
}: FileItemProps) => {
  const { itemVariants } = getOptimizedVariants();

  const handleClick = () => {
    if (file.type === 'folder' && !searchQuery) {
      onFolderClick(file.path);
    }
  };

  return (
    <motion.div
      key={file.id}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.6, delay: (index + 3) * 0.1 }}
      className="group border border-white/10 rounded-lg p-4 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-4">
        {/* File Info */}
        <div 
          className={`flex items-center gap-4 flex-1 min-w-0 ${
            file.type === 'folder' && !searchQuery ? 'cursor-pointer' : ''
          }`}
          onClick={handleClick}
        >
          <div className="flex-shrink-0">
            <FontAwesomeIcon 
              icon={getFileIcon(file.extension, file.type)} 
              className={`text-2xl ${
                file.type === 'folder' 
                  ? 'text-blue-400' 
                  : 'text-gray-400'
              }`} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-medium truncate mb-1 ${
              file.type === 'folder' 
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
                  onClick={() => onPreview(file)}
                  className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-manipulation"
                  style={{ minHeight: '36px', minWidth: '36px' }}
                  aria-label="Preview"
                >
                  <FontAwesomeIcon icon={faEye} className="text-sm" />
                </button>
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
              onClick={() => {
                // downloadFolder logic here
              }}
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
  );
});

FileItem.displayName = 'FileItem';

export default FileItem;