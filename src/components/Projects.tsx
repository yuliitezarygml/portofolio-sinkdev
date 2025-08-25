import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faExternalLinkAlt, faStar, faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { getOptimizedVariants } from '../utils/animations';

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  homepage?: string;
  topics: string[];
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

const Projects = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackProjects = [
    {
      id: 1,
      name: "SWA Cloud",
      description: "A comprehensive cloud platform providing various services and solutions. Built with modern technologies and designed for scalability and performance.",
      html_url: "https://github.com/yuliitezarygml",
      homepage: "https://swacloud.com",
      topics: ["python", "nodejs", "mongodb", "docker"],
      language: "Python",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "Portfolio Website",
      description: "Modern React portfolio website with dynamic GitHub integration and professional design.",
      html_url: "https://github.com/yuliitezarygml",
      homepage: "",
      topics: ["react", "typescript", "tailwind", "framer-motion"],
      language: "TypeScript",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "Web Application",
      description: "Full-stack web application with modern architecture and responsive design. Features include user authentication, real-time updates, and API integration.",
      html_url: "https://github.com/yuliitezarygml",
      homepage: "",
      topics: ["react", "nodejs", "express", "mongodb"],
      language: "JavaScript",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: "Mobile App",
      description: "Cross-platform mobile application built with React Native. Includes offline functionality, push notifications, and seamless user experience.",
      html_url: "https://github.com/yuliitezarygml",
      homepage: "",
      topics: ["react-native", "expo", "firebase", "redux"],
      language: "TypeScript",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      name: "API Service",
      description: "RESTful API service with comprehensive documentation and testing. Built for high performance and scalability with microservices architecture.",
      html_url: "https://github.com/yuliitezarygml",
      homepage: "",
      topics: ["nodejs", "express", "docker", "swagger"],
      language: "JavaScript",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      name: "Data Analytics Tool",
      description: "Advanced data analytics and visualization tool. Features real-time data processing, interactive dashboards, and machine learning capabilities.",
      html_url: "https://github.com/yuliitezarygml",
      homepage: "",
      topics: ["python", "pandas", "plotly", "machine-learning"],
      language: "Python",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    const fetchPinnedRepos = async () => {
      try {
        console.log('Fetching GitHub repos...');
        const response = await fetch('https://api.github.com/users/yuliitezarygml/repos?sort=stars&per_page=30');
        
        if (!response.ok) {
          console.error('API response not ok:', response.status, response.statusText);
          throw new Error(`Failed to fetch repositories: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('GitHub API response:', data);
        
        // Если нет данных, используем fallback
        if (!Array.isArray(data) || data.length === 0) {
          console.log('No repos found, using fallback');
          setRepos(fallbackProjects);
          setLoading(false);
          return;
        }
        
        // Фильтруем репозитории - берем все публичные с описанием
        const filteredRepos = data
          .filter((repo: GitHubRepo) => {
            const hasDescription = repo.description && repo.description.trim() !== '';
            const isNotFork = !repo.name.toLowerCase().includes('fork');
            return hasDescription && isNotFork;
          })
          .slice(0, 6); // Берем топ 6
        
        console.log('Filtered repos:', filteredRepos);
        setRepos(filteredRepos.length > 0 ? filteredRepos : fallbackProjects);
      } catch (err) {
        console.error('Error fetching GitHub repos:', err);
        setError('Failed to load projects from GitHub');
        setRepos(fallbackProjects);
      } finally {
        setLoading(false);
      }
    };

    fetchPinnedRepos();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  };

  return (
    <section id="projects" className="section-padding bg-zinc-950/50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            My Projects
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl">
            A selection of my recent work
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <p className="text-gray-400">Showing fallback projects</p>
          </div>
        ) : null}

        <div className="space-y-8">
          {repos.map((repo, index) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="border border-white/10 rounded-lg p-4 md:p-6 hover:border-white/20 transition-all duration-200">
                {/* Project Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <h3 className="text-lg md:text-xl font-semibold text-white flex-1 min-w-0">
                      {repo.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </h3>
                    
                    {/* Tech Stack in top right on same line as title */}
                    <div className="flex flex-wrap gap-1 justify-end">
                      {repo.topics.slice(0, window.innerWidth >= 768 ? repo.topics.length : 3).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-1 text-xs bg-white/5 text-gray-400 rounded border border-white/10 truncate"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                    {repo.description || 'No description available.'}
                  </p>
                </div>

                {/* Bottom section with stats and links */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  {/* Project Stats */}
                  <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-white/40"></div>
                        <span className="truncate">{repo.language}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faStar} />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCodeBranch} />
                      <span>{repo.forks_count}</span>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="flex gap-2">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-manipulation"
                      style={{ minHeight: '36px', minWidth: '36px' }}
                      aria-label="View on GitHub"
                    >
                      <FontAwesomeIcon icon={faGithub} className="text-sm" />
                    </a>
                    {repo.homepage && (
                      <a
                        href={repo.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-manipulation"
                        style={{ minHeight: '36px', minWidth: '36px' }}
                        aria-label="View live demo"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View More Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 pt-6 border-t border-white/10"
        >
          <a
            href="https://github.com/yuliitezarygml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faGithub} className="text-sm" />
            <span className="text-sm">View all projects on GitHub</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;