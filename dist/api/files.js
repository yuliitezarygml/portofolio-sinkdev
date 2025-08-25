// Простой API для чтения файлов из папки Files
// В реальном проекте это будет серверная часть

const fs = require('fs');
const path = require('path');

const FILES_DIR = path.join(__dirname, '../Files');

// Функция для получения информации о файле/папке
function getFileInfo(filePath, fileName) {
  const fullPath = path.join(filePath, fileName);
  const stats = fs.statSync(fullPath);
  const isDirectory = stats.isDirectory();
  
  const relativePath = path.relative(FILES_DIR, fullPath).replace(/\\/g, '/');
  const parentPath = path.dirname(relativePath).replace(/\\/g, '/');
  
  return {
    id: Buffer.from(fullPath).toString('base64'),
    name: fileName,
    type: isDirectory ? 'folder' : 'file',
    size: isDirectory ? undefined : stats.size,
    uploadDate: stats.mtime.toISOString().split('T')[0],
    extension: isDirectory ? undefined : path.extname(fileName).slice(1).toLowerCase(),
    path: '/' + relativePath,
    parentPath: parentPath === '.' ? '/' : '/' + parentPath
  };
}

// Функция для чтения содержимого директории
function getDirectoryContents(dirPath) {
  const fullPath = path.join(FILES_DIR, dirPath === '/' ? '' : dirPath);
  
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  
  const items = fs.readdirSync(fullPath);
  return items.map(item => getFileInfo(fullPath, item));
}

// Экспорт для использования в API роутах
module.exports = {
  getDirectoryContents,
  getFileInfo,
  FILES_DIR
};