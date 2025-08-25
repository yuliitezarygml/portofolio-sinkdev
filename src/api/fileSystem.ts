export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  uploadDate: string;
  extension?: string;
  path: string;
  parentPath: string;
}

// В реальном приложении это будет API к серверу
// Пока используем mock данные, отражающие реальные файлы в папке Files
const fileSystemData: { [key: string]: FileSystemItem[] } = {
  '/': [
    {
      id: '1',
      name: 'AutoClicker-3.1.1.exe',
      type: 'file',
      size: 2450000, // примерный размер
      uploadDate: '2025-01-26',
      extension: 'exe',
      path: '/AutoClicker-3.1.1.exe',
      parentPath: '/'
    }
  ],
};

export const getDirectoryContents = async (path: string = '/'): Promise<FileSystemItem[]> => {
  // Симуляция загрузки
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return fileSystemData[path] || [];
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

export const getAllItems = (): FileSystemItem[] => {
  return Object.values(fileSystemData).flat();
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