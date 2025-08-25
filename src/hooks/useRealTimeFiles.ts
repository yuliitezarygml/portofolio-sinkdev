import { useState, useEffect } from 'react';
import type { FileSystemItem } from '../api/realTimeFileSystem';

// Hook для отслеживания реальных файлов в папке Files
export const useRealTimeFiles = (targetPath: string = '/') => {
  const [files, setFiles] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const scanDirectory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Используем наш API endpoint с параметром пути
        const response = await fetch(`/api/files?path=${encodeURIComponent(targetPath)}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const filesData = await response.json();
        console.log('API response:', filesData);
        
        if (isMounted) {
          setFiles(Array.isArray(filesData) ? filesData : []);
        }
      } catch (err) {
        console.error('Error scanning directory:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          // Fallback - показываем пустой список
          setFiles([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Первоначальное сканирование
    scanDirectory();

    return () => {
      isMounted = false;
    };
  }, [targetPath]);

  return { files, loading, error };
};

// Парсинг HTML листинга директории от сервера
const parseDirectoryHTML = (html: string): FileSystemItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a[href]');
  const files: FileSystemItem[] = [];

  console.log('Parsing HTML:', html.substring(0, 500)); // Debug

  links.forEach((link, index) => {
    const href = link.getAttribute('href');
    const text = link.textContent?.trim();
    
    console.log('Found link:', { href, text }); // Debug
    
    if (href && text && href !== '../' && !href.startsWith('?') && !href.startsWith('http')) {
      const isFolder = href.endsWith('/');
      const fileName = isFolder ? text.replace('/', '') : text;
      
      if (fileName && fileName !== '.' && fileName !== '..' && fileName !== 'Parent Directory') {
        const fileItem = {
          id: `file-${index}-${Date.now()}`,
          name: fileName,
          type: isFolder ? 'folder' : 'file',
          uploadDate: new Date().toISOString().split('T')[0],
          extension: isFolder ? undefined : fileName.split('.').pop()?.toLowerCase(),
          path: `/${fileName}`,
          parentPath: '/'
        };
        
        console.log('Adding file:', fileItem); // Debug
        files.push(fileItem);
      }
    }
  });

  console.log('Final parsed files:', files); // Debug
  return files;
};