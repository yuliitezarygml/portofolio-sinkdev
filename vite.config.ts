import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

// Request logs storage
let requestLogs: Array<{
  id: string;
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  status?: number;
}> = [];

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5006,
    allowedHosts: ['sinkdev.dev', 'localhost', '127.0.0.1'],
  },
  preview: {
    allowedHosts: ['sinkdev.dev', 'localhost', '127.0.0.1'],
    port: 5006,
  },
  plugins: [
    react(),
    // Простой плагин для API файлов
    {
      name: 'files-api',
      configureServer(server) {
        // Request logging middleware - must be first to capture all requests
        server.middlewares.use((req, res, next) => {
          const startTime = Date.now();
          const url = req.url || '';

          // Detect request type
          const isFileDownload = url.includes('/Files/') && !url.includes('/api/');
          const isAPIRequest = url.startsWith('/api/');

          // Extract file info for downloads
          let fileName = '';
          let fileType = '';
          if (isFileDownload) {
            const pathParts = url.split('/');
            fileName = decodeURIComponent(pathParts[pathParts.length - 1].split('?')[0]);
            fileType = fileName.split('.').pop() || 'unknown';
          }

          const logEntry: any = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            method: req.method || 'UNKNOWN',
            url: url,
            ip: Array.isArray(req.headers['x-forwarded-for'])
              ? req.headers['x-forwarded-for'][0]
              : req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            referer: req.headers['referer'] || req.headers['referrer'] || '-',
            type: isFileDownload ? 'download' : isAPIRequest ? 'api' : 'page',
            fileName: fileName || undefined,
            fileType: fileType || undefined,
            apiEndpoint: isAPIRequest ? url.split('?')[0] : undefined
          };

          // Store the original end function
          const originalEnd = res.end;

          // Override res.end to capture status code and response time
          res.end = function (chunk: any, encoding?: any) {
            const responseTime = Date.now() - startTime;
            logEntry.status = res.statusCode;
            logEntry.responseTime = responseTime;

            // Estimate response size
            if (chunk) {
              logEntry.responseSize = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk.toString());
            }

            // Add to logs array (keep only last 200 entries)
            requestLogs.unshift(logEntry);
            if (requestLogs.length > 200) {
              requestLogs = requestLogs.slice(0, 200);
            }

            // Call original end function
            return originalEnd.call(this, chunk, encoding);
          };

          next();
        });
        server.middlewares.use('/api/files', (req, res) => {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const requestedPath = url.searchParams.get('path') || '/'
          const filesDir = path.join(process.cwd(), 'public', 'Files')
          const targetDir = path.join(filesDir, requestedPath === '/' ? '' : requestedPath)

          try {
            if (!fs.existsSync(targetDir)) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Directory not found' }))
              return
            }

            const files = fs.readdirSync(targetDir, { withFileTypes: true })

            // Функция для подсчета файлов и размера в папке рекурсивно
            const getFolderStats = (folderPath: string) => {
              let fileCount = 0
              let totalSize = 0

              const scanFolder = (currentPath: string) => {
                try {
                  const items = fs.readdirSync(currentPath, { withFileTypes: true })
                  items.forEach(item => {
                    const itemPath = path.join(currentPath, item.name)
                    if (item.isFile()) {
                      fileCount++
                      totalSize += fs.statSync(itemPath).size
                    } else if (item.isDirectory()) {
                      scanFolder(itemPath)
                    }
                  })
                } catch (err: any) {
                  console.error('Error scanning folder:', err)
                }
              }

              scanFolder(folderPath)
              return { fileCount, totalSize }
            }

            const fileList = files.map((file, index) => {
              const filePath = path.join(targetDir, file.name)
              const stats = fs.statSync(filePath)
              const relativePath = path.join(requestedPath, file.name).replace(/\\/g, '/')

              let folderStats = null
              if (file.isDirectory()) {
                folderStats = getFolderStats(filePath)
              }

              return {
                id: `${file.name}-${index}`,
                name: file.name,
                type: file.isDirectory() ? 'folder' : 'file',
                size: file.isFile() ? stats.size : folderStats?.totalSize,
                fileCount: file.isDirectory() ? folderStats?.fileCount : undefined,
                uploadDate: stats.mtime.toISOString().split('T')[0],
                extension: file.isFile() ? path.extname(file.name).slice(1).toLowerCase() : undefined,
                path: relativePath.startsWith('/') ? relativePath : '/' + relativePath,
                parentPath: requestedPath
              }
            })

            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify(fileList))
          } catch (error) {
            console.error('Error reading files:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to read files' }))
          }
        })

        // API для скачивания папок как ZIP
        server.middlewares.use('/api/download-folder', (req, res) => {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const folderPath = url.searchParams.get('path')

          if (!folderPath) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Path parameter required' }))
            return
          }

          const filesDir = path.join(process.cwd(), 'public', 'Files')
          const targetDir = path.join(filesDir, folderPath)

          if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Folder not found' }))
            return
          }

          const folderName = path.basename(folderPath)
          const zipName = `${folderName}.zip`

          // Настраиваем заголовки для скачивания ZIP
          res.setHeader('Content-Type', 'application/zip')
          res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`)

          // Создаем ZIP архив
          const archive = archiver('zip', {
            zlib: { level: 9 } // Максимальное сжатие
          })

          // Обработка ошибок
          archive.on('error', (err: any) => {
            console.error('Archive error:', err)
            res.statusCode = 500
            res.end('Archive creation failed')
          })

          // Пайп архива в response
          archive.pipe(res)

          // Добавляем всю папку в архив рекурсивно
          archive.directory(targetDir, false)

          // Финализируем архив
          archive.finalize()
        })

        // API для скачивания всех файлов как ZIP
        server.middlewares.use('/api/download-all', (_req, res) => {
          const filesDir = path.join(process.cwd(), 'public', 'Files')

          if (!fs.existsSync(filesDir)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Files directory not found' }))
            return
          }

          const zipName = 'AllFiles.zip'

          // Настраиваем заголовки для скачивания ZIP
          res.setHeader('Content-Type', 'application/zip')
          res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`)

          // Создаем ZIP архив
          const archive = archiver('zip', {
            zlib: { level: 9 } // Максимальное сжатие
          })

          // Обработка ошибок
          archive.on('error', (err: any) => {
            console.error('Archive error:', err)
            res.statusCode = 500
            res.end('Archive creation failed')
          })

          // Пайп архива в response
          archive.pipe(res)

          // Добавляем всю папку Files в архив
          archive.directory(filesDir, false)

          // Финализируем архив
          archive.finalize()
        })

        // API для логов запросов
        server.middlewares.use('/api/request-logs', (req, res) => {
          try {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(requestLogs));
          } catch (error) {
            console.error('Error getting request logs:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to get request logs' }));
          }
        });

        // API для загрузки файлов
        server.middlewares.use('/api/upload', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const contentType = req.headers['content-type'] || '';
          if (!contentType.includes('multipart/form-data')) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }));
            return;
          }

          let body = Buffer.alloc(0);
          req.on('data', chunk => {
            body = Buffer.concat([body, chunk]);
          });

          req.on('end', () => {
            try {
              // Simple multipart parser (basic implementation)
              const boundary = contentType.split('boundary=')[1];
              if (!boundary) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'No boundary found' }));
                return;
              }

              const parts = body.toString('binary').split(`--${boundary}`);
              let uploadPath = '/';
              let fileData = null;
              let fileName = '';

              for (const part of parts) {
                if (part.includes('name="path"')) {
                  const pathMatch = part.match(/\r\n\r\n(.+)/);
                  if (pathMatch) uploadPath = pathMatch[1].trim();
                }
                if (part.includes('name="file"')) {
                  const filenameMatch = part.match(/filename="([^"]+)"/);
                  if (filenameMatch) fileName = filenameMatch[1];

                  const dataStart = part.indexOf('\r\n\r\n') + 4;
                  if (dataStart > 3) {
                    fileData = Buffer.from(part.slice(dataStart), 'binary');
                  }
                }
              }

              if (!fileData || !fileName) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'No file data received' }));
                return;
              }

              const filesDir = path.join(process.cwd(), 'public', 'Files');
              const targetDir = path.join(filesDir, uploadPath === '/' ? '' : uploadPath);
              const targetFile = path.join(targetDir, fileName);

              // Ensure directory exists
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }

              // Write file
              fs.writeFileSync(targetFile, fileData);

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true, fileName }));
            } catch (error) {
              console.error('Upload error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to upload file' }));
            }
          });
        });

        // API для создания папок
        server.middlewares.use('/api/create-folder', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', () => {
            try {
              const { path: folderPath, name } = JSON.parse(body);
              const filesDir = path.join(process.cwd(), 'public', 'Files');
              const targetPath = path.join(filesDir, folderPath === '/' ? '' : folderPath, name);

              if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ success: true }));
              } else {
                res.statusCode = 409;
                res.end(JSON.stringify({ error: 'Folder already exists' }));
              }
            } catch (error) {
              console.error('Create folder error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to create folder' }));
            }
          });
        });

        // API для удаления файлов/папок
        server.middlewares.use('/api/delete', (req, res) => {
          if (req.method !== 'DELETE') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', () => {
            try {
              const { path: deletePath } = JSON.parse(body);
              const filesDir = path.join(process.cwd(), 'public', 'Files');
              const targetPath = path.join(filesDir, deletePath);

              if (fs.existsSync(targetPath)) {
                const stats = fs.statSync(targetPath);
                if (stats.isDirectory()) {
                  fs.rmSync(targetPath, { recursive: true, force: true });
                } else {
                  fs.unlinkSync(targetPath);
                }
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ success: true }));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'File not found' }));
              }
            } catch (error) {
              console.error('Delete error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to delete file' }));
            }
          });
        });

        // API для переименования файлов/папок
        server.middlewares.use('/api/rename', (req, res) => {
          if (req.method !== 'PUT') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', () => {
            try {
              const { oldPath, newName } = JSON.parse(body);
              const filesDir = path.join(process.cwd(), 'public', 'Files');
              const oldTargetPath = path.join(filesDir, oldPath);
              const directory = path.dirname(oldTargetPath);
              const newTargetPath = path.join(directory, newName);

              if (fs.existsSync(oldTargetPath)) {
                if (!fs.existsSync(newTargetPath)) {
                  fs.renameSync(oldTargetPath, newTargetPath);
                  res.setHeader('Content-Type', 'application/json');
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  res.end(JSON.stringify({ success: true }));
                } else {
                  res.statusCode = 409;
                  res.end(JSON.stringify({ error: 'File with that name already exists' }));
                }
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'File not found' }));
              }
            } catch (error) {
              console.error('Rename error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to rename file' }));
            }
          });
        });

        // API для системной статистики
        server.middlewares.use('/api/system-stats', async (req, res) => {
          try {
            const { default: os } = await import('os')

            // Реальная нагрузка CPU через измерение времени
            const getCpuUsage = () => {
              return new Promise((resolve) => {
                const startMeasure = process.cpuUsage()
                const startTime = process.hrtime()

                setTimeout(() => {
                  const delta = process.cpuUsage(startMeasure)
                  const totalTime = process.hrtime(startTime)
                  const totalTimeNs = totalTime[0] * 1e9 + totalTime[1]
                  const cpuTimeNs = (delta.user + delta.system) * 1000
                  const cpuUsage = Math.round((cpuTimeNs / totalTimeNs) * 100)
                  resolve(Math.min(cpuUsage, 100))
                }, 100)
              })
            }

            // Получение реальной информации о диске
            const getDiskUsage = async () => {
              try {
                const { default: fs } = await import('fs')
                const { promisify } = await import('util')
                const stat = promisify(fs.stat)

                if (process.platform === 'win32') {
                  // Для Windows используем PowerShell (wmic устарел)
                  const { exec } = await import('child_process')
                  const execPromise = promisify(exec)

                  try {
                    // Используем PowerShell Get-Volume вместо wmic
                    const { stdout } = await execPromise(
                      'powershell -Command "Get-Volume | Where-Object {$_.DriveLetter} | Select-Object DriveLetter, Size, SizeRemaining | ConvertTo-Json"',
                      { encoding: 'utf8' }
                    )

                    const volumes = JSON.parse(stdout)
                    const volumeArray = Array.isArray(volumes) ? volumes : [volumes]

                    let totalSize = 0
                    let totalFree = 0

                    for (const volume of volumeArray) {
                      if (volume.Size && volume.SizeRemaining) {
                        totalSize += volume.Size
                        totalFree += volume.SizeRemaining
                      }
                    }

                    const used = totalSize - totalFree
                    const percentage = totalSize > 0 ? ((used / totalSize) * 100).toFixed(1) : '0.0'

                    return {
                      used: formatBytes(used),
                      total: formatBytes(totalSize),
                      percentage: `${percentage}%`
                    }
                  } catch (error) {
                    console.error('Windows disk usage error:', error)
                    return { used: 'N/A', total: 'N/A', percentage: 'N/A' }
                  }
                } else {
                  // Для Linux/macOS используем df команду
                  const { exec } = await import('child_process')
                  const execPromise = promisify(exec)

                  try {
                    // Используем df для получения информации о диске
                    const { stdout } = await execPromise('df -B1 /')

                    // Парсим вывод df
                    const lines = stdout.split('\n').filter(line => line.trim())
                    if (lines.length < 2) {
                      return { used: 'N/A', total: 'N/A', percentage: 'N/A' }
                    }

                    // Вторая строка содержит данные о корневом разделе
                    const parts = lines[1].split(/\s+/)

                    // df -B1 выводит: Filesystem 1B-blocks Used Available Use% Mounted
                    // parts[0] = filesystem, parts[1] = total, parts[2] = used, parts[3] = available
                    const totalSize = parseInt(parts[1]) || 0
                    const usedSize = parseInt(parts[2]) || 0
                    const percentage = totalSize > 0 ? ((usedSize / totalSize) * 100).toFixed(1) : '0.0'

                    return {
                      used: formatBytes(usedSize),
                      total: formatBytes(totalSize),
                      percentage: `${percentage}%`
                    }
                  } catch (error) {
                    console.error('Linux disk usage error:', error)

                    // Fallback: попробуем через Node.js fs.statfs (если доступно)
                    try {
                      const { default: fs } = await import('fs')
                      const { promisify } = await import('util')

                      // @ts-ignore - statfs может быть недоступен в типах
                      if (fs.statfs) {
                        // @ts-ignore
                        const statfs = promisify(fs.statfs)
                        const stats = await statfs('/')

                        const totalSize = stats.blocks * stats.bsize
                        const freeSize = stats.bfree * stats.bsize
                        const usedSize = totalSize - freeSize
                        const percentage = totalSize > 0 ? ((usedSize / totalSize) * 100).toFixed(1) : '0.0'

                        return {
                          used: formatBytes(usedSize),
                          total: formatBytes(totalSize),
                          percentage: `${percentage}%`
                        }
                      }
                    } catch (fallbackError) {
                      console.error('Fallback disk usage error:', fallbackError)
                    }

                    return { used: 'N/A', total: 'N/A', percentage: 'N/A' }
                  }
                }
              } catch (error) {
                return { used: 'N/A', total: 'N/A', percentage: 'N/A' }
              }
            }

            // Память
            const totalMemory = os.totalmem()
            const freeMemory = os.freemem()
            const usedMemory = totalMemory - freeMemory
            const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(1)

            // Uptime
            const uptime = os.uptime()
            const formatUptime = (seconds: number) => {
              const days = Math.floor(seconds / 86400)
              const hours = Math.floor((seconds % 86400) / 3600)
              const minutes = Math.floor((seconds % 3600) / 60)

              if (days > 0) {
                return `${days}d ${hours}h ${minutes}m`
              } else if (hours > 0) {
                return `${hours}h ${minutes}m`
              } else {
                return `${minutes}m`
              }
            }

            // Форматирование байтов
            const formatBytes = (bytes: number) => {
              const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
              if (bytes === 0) return '0 Bytes'
              const i = Math.floor(Math.log(bytes) / Math.log(1024))
              return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
            }

            // Получаем реальные данные
            const [cpuUsage, diskUsage] = await Promise.all([
              getCpuUsage(),
              getDiskUsage()
            ])

            const cpus = os.cpus()

            const stats = {
              cpu: {
                usage: `${cpuUsage}%`,
                cores: cpus.length,
                model: cpus[0]?.model || 'Unknown'
              },
              memory: {
                total: formatBytes(totalMemory),
                used: formatBytes(usedMemory),
                free: formatBytes(freeMemory),
                percentage: memoryUsage
              },
              disk: diskUsage,
              uptime: formatUptime(uptime),
              platform: `${os.type()} ${os.release()}`,
              nodeVersion: process.version,
              architecture: os.arch(),
              hostname: os.hostname()
            }

            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify(stats))
          } catch (error) {
            console.error('Error getting system stats:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to get system stats' }))
          }
        })
      }
    }
  ],

  // Оптимизации сборки
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          animations: ['framer-motion'],
          icons: ['@fortawesome/react-fontawesome', '@fortawesome/free-solid-svg-icons'],
          markdown: ['react-markdown', 'react-syntax-highlighter']
        }
      }
    }
  },

  // Оптимизации для разработки
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },

  // Preload оптимизации
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      '@fortawesome/react-fontawesome',
      '@fortawesome/free-solid-svg-icons'
    ]
  }
})
