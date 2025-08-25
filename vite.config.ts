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
    allowedHosts: ['sinkdev.dev'], 
  },
    preview: {
    allowedHosts: ['sinkdev.dev'],
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
          const logEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            method: req.method || 'UNKNOWN',
            url: req.url || '',
            ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown'
          };
          
          // Store the original end function
          const originalEnd = res.end;
          
          // Override res.end to capture status code
          res.end = function(chunk, encoding) {
            logEntry.status = res.statusCode;
            
            // Add to logs array (keep only last 100 entries)
            requestLogs.unshift(logEntry);
            if (requestLogs.length > 100) {
              requestLogs = requestLogs.slice(0, 100);
            }
            
            // Call original end function
            originalEnd.call(this, chunk, encoding);
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

        // Video Extractor API Configuration
        const API_SECRET = "SINKDEVFREE";

        const COOKIES = {
          "_ym_uid": "1752693302397193656",
          "_ym_d": "1752693302",
          "cf_clearance": "fDjfwfgXvRtIO5cBLneGrPm6yVNARdEAMlCLmP7Dx0c-1755507863-1.2.1.1-EojwxcJ1lcYC5whnQWCdkQvufg6FNip_LtpCQqLBgWEuKvf_xY7Cta6ULZWK1UeW1QH8tlZiZQvao_vs_ZGNIj5UURE9eTdVDGEfbq8NFPU4CcxVH7vwhx0LftEYrelnk6afd1s4IPGf8f5wrJ6AYg0jNEYWQAoMRKS4nNfHdiaHcXb6GCfYML8bZsfocpl9tI5CPp.s10HOCKjJdrE0GX3.mm70MK2upmTaavknYJw",
          "dle_user_id": "1387363",
          "dle_password": "3acc218f9c038f43494a609123a52331",
          "PHPSESSID": "tsd7k7j9v7075veaai8kmha284"
        };

        const VIDEO_HEADERS = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
          "Referer": "https://jut.su/",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1"
        };

        function verifyApiKey(apiKey: string) {
          return apiKey === API_SECRET;
        }

        function extractVideoFromHtml(html: string) {
          const videoPatterns = [
            /https?:\/\/r\d+\.yandexwebcache\.org\/[^"'\>\s]+\.mp4[^"'\>\s]*/gi,
            /https?:\/\/[^"'\>\s]*yandex[^"'\>\s]*\.mp4[^"'\>\s]*/gi,
            /https?:\/\/[^"'\>\s]+\.mp4\?hash=[^"'\>\s]+/gi,
            /"(https?:\/\/[^"]+\.mp4[^"]*)"/gi,
            /'(https?:\/\/[^']+\.mp4[^']*)'/gi
          ];
          
          for (const pattern of videoPatterns) {
            const matches = html.match(pattern);
            if (matches && matches.length > 0) {
              console.log(`Found ${matches.length} video links`);
              
              for (const match of matches) {
                const url = match.replace(/['"]/g, '');
                if (url.includes("1080") && url.startsWith('http')) {
                  console.log(`Found 1080p link: ${url}`);
                  return url;
                }
              }
              
              if (matches.length > 0) {
                const url = matches[0].replace(/['"]/g, '');
                if (url.startsWith('http')) {
                  console.log(`Found link: ${url}`);
                  return url;
                }
              }
            }
          }
          
          const jsPatterns = [
            /src[\s]*:[\s]*["'](https?:\/\/[^"']+\.mp4[^"']*)/gi,
            /video[\s]*:[\s]*["'](https?:\/\/[^"']+\.mp4[^"']*)/gi,
            /url[\s]*:[\s]*["'](https?:\/\/[^"']+\.mp4[^"']*)/gi
          ];
          
          for (const pattern of jsPatterns) {
            const matches = html.match(pattern);
            if (matches && matches.length > 0) {
              for (const match of matches) {
                const urlMatch = match.match(/https?:\/\/[^"']+\.mp4[^"']*/);
                if (urlMatch && urlMatch[0].startsWith('http')) {
                  console.log(`Found link in JS: ${urlMatch[0]}`);
                  return urlMatch[0];
                }
              }
            }
          }
          
          return null;
        }

        function cookiesToString(cookies: Record<string, string>) {
          return Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
        }

        // Video extractor API
        server.middlewares.use('/api/extract', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              const { api_key, url: episodeUrl } = JSON.parse(body);
              
              if (!verifyApiKey(api_key)) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: false, 
                  error: 'Invalid API key' 
                }));
                return;
              }
              
              if (!episodeUrl || !episodeUrl.startsWith('https://jut.su/')) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: false, 
                  error: 'Invalid URL' 
                }));
                return;
              }
              
              console.log(`Processing: ${episodeUrl}`);
              
              // Use dynamic import for node-fetch
              const fetch = (await import('node-fetch')).default;
              
              const response = await fetch(episodeUrl, {
                headers: {
                  ...VIDEO_HEADERS,
                  'Cookie': cookiesToString(COOKIES)
                }
              });
              
              if (!response.ok) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: `Page load error: ${response.status}`
                }));
                return;
              }
              
              console.log("Page loaded, searching for video...");
              const html = await response.text();
              
              const videoUrl = extractVideoFromHtml(html);
              
              if (videoUrl) {
                console.log(`✅ Link found: ${videoUrl}`);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: true, 
                  video_url: videoUrl 
                }));
              } else {
                const lowerHtml = html.toLowerCase();
                let errorMsg = 'Video not found';
                
                if (lowerHtml.includes('premium') || 
                    lowerHtml.includes('подписка') || 
                    lowerHtml.includes('jutsu+')) {
                  errorMsg = 'Premium subscription required';
                }
                
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: false, 
                  error: errorMsg 
                }));
              }
              
            } catch (error: any) {
              console.error('Error:', error.message);
              
              if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: false, 
                  error: `Network error: ${error.message}` 
                }));
                return;
              }
              
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: false, 
                error: `Server error: ${error.message}` 
              }));
            }
          });
        });

        // Video extractor health check
        server.middlewares.use('/api/video-health', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ 
            status: 'ok', 
            message: 'Video extractor API is running' 
          }));
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
                  // Для Windows используем системную команду
                  const { exec } = await import('child_process')
                  const execPromise = promisify(exec)
                  
                  try {
                    const { stdout } = await execPromise('wmic logicaldisk get size,freespace,caption')
                    const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('Caption'))
                    
                    let totalSize = 0
                    let totalFree = 0
                    
                    for (const line of lines) {
                      const parts = line.trim().split(/\s+/)
                      if (parts.length >= 3) {
                        const free = parseInt(parts[1]) || 0
                        const size = parseInt(parts[2]) || 0
                        totalSize += size
                        totalFree += free
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
                  // Для Linux/macOS используем statvfs
                  try {
                    const stats = await stat('/')
                    return { used: 'N/A', total: 'N/A', percentage: 'N/A' }
                  } catch (error) {
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
