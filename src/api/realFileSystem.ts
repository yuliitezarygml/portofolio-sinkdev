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

// Функция для чтения реальных файлов из папки Files
export const getDirectoryContents = async (path: string = '/'): Promise<FileSystemItem[]> => {
  try {
    // Преобразуем путь для API
    const apiPath = path === '/' ? '' : path;
    const response = await fetch(`/api/files${apiPath}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    
    const files = await response.json();
    return files;
  } catch (error) {
    console.error('Error fetching files:', error);
    
    // Fallback - показываем пустую папку если API не работает
    return [];
  }
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

export const getAllItems = async (): Promise<FileSystemItem[]> => {
  try {
    const response = await fetch('/api/files/all');
    if (!response.ok) {
      throw new Error('Failed to fetch all files');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all files:', error);
    return [];
  }
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