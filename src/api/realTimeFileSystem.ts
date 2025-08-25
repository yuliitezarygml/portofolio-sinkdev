export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  fileCount?: number; // Количество файлов в папке
  uploadDate: string;
  extension?: string;
  path: string;
  parentPath: string;
}

// Функция для сканирования реальной папки Files
export const scanRealFiles = async (path: string = '/'): Promise<FileSystemItem[]> => {
  try {
    // Используем File System Access API для чтения папки Files
    const response = await fetch('/api/scan-files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      throw new Error('Failed to scan files');
    }

    return await response.json();
  } catch (error) {
    console.error('Error scanning files:', error);
    
    // Fallback - читаем файлы напрямую через браузер API
    return scanFilesDirectly(path);
  }
};

// Альтернативный способ - прямое сканирование через браузер
const scanFilesDirectly = async (path: string): Promise<FileSystemItem[]> => {
  try {
    // Пытаемся получить доступ к папке Files в public
    const filesPath = `/Files${path === '/' ? '' : path}`;
    
    // Делаем запрос к серверу для получения списка файлов
    const response = await fetch(`${filesPath}?list=true`);
    
    if (response.ok) {
      const html = await response.text();
      return parseDirectoryListing(html, path);
    }
    
    // Если не работает, возвращаем актуальные файлы из папки
    return getCurrentFiles();
  } catch (error) {
    console.error('Error in direct scan:', error);
    return getCurrentFiles();
  }
};

// Парсинг HTML листинга директории
const parseDirectoryListing = (html: string, currentPath: string): FileSystemItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a');
  const files: FileSystemItem[] = [];

  links.forEach((link, index) => {
    const href = link.getAttribute('href');
    if (href && href !== '../' && !href.startsWith('?')) {
      const fileName = decodeURIComponent(href.replace(/\/$/, ''));
      const isFolder = href.endsWith('/');
      
      files.push({
        id: `${currentPath}-${index}`,
        name: fileName,
        type: isFolder ? 'folder' : 'file',
        uploadDate: new Date().toISOString().split('T')[0],
        extension: isFolder ? undefined : fileName.split('.').pop()?.toLowerCase(),
        path: `${currentPath === '/' ? '' : currentPath}/${fileName}`,
        parentPath: currentPath
      });
    }
  });

  return files;
};

// Получение актуальных файлов с сервера
const getCurrentFiles = async (): Promise<FileSystemItem[]> => {
  // Здесь можно сделать запрос к вашему API
  // Пока возвращаем актуальные файлы из папки Files
  
  return [
    {
      id: '1',
      name: 'AutoClicker-3.1.1.exe',
      type: 'file',
      size: await getFileSize('/Files/AutoClicker-3.1.1.exe'),
      uploadDate: new Date().toISOString().split('T')[0],
      extension: 'exe',
      path: '/AutoClicker-3.1.1.exe',
      parentPath: '/'
    }
  ];
};

// Получение размера файла
const getFileSize = async (filePath: string): Promise<number> => {
  try {
    const response = await fetch(filePath, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength) : 0;
  } catch {
    return 0;
  }
};

// Функция для отслеживания изменений в реальном времени
export const watchFiles = (path: string, callback: (files: FileSystemItem[]) => void) => {
  const pollInterval = 2000; // Проверяем каждые 2 секунды
  
  const poll = async () => {
    try {
      const files = await scanRealFiles(path);
      callback(files);
    } catch (error) {
      console.error('Error polling files:', error);
    }
  };

  // Первоначальная загрузка
  poll();
  
  // Периодическое обновление
  const intervalId = setInterval(poll, pollInterval);
  
  // Возвращаем функцию для остановки отслеживания
  return () => clearInterval(intervalId);
};

export const getFileSystemStats = (allItems: FileSystemItem[]) => {
  const files = allItems.filter(item => item.type === 'file');
  const folders = allItems.filter(item => item.type === 'folder');
  const totalSize = files.reduce((total, file) => total + (file.size || 0), 0);
  
  return {
    filesCount: files.length,
    foldersCount: folders.length,
    totalSize: Math.round(totalSize / 1024 / 1024) // MB
  };
};

export const getBreadcrumbs = (currentPath: string): { name: string; path: string }[] => {
  if (currentPath === '/') {
    return [{ name: 'Files', path: '/' }];
  }
  
  const parts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'Files', path: '/' }];
  
  let buildPath = '';
  for (const part of parts) {
    buildPath += '/' + part;
    breadcrumbs.push({ name: part, path: buildPath });
  }
  
  return breadcrumbs;
};