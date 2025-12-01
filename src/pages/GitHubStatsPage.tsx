import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faStar,
    faCodeFork,
    faEye,
    faBook,
    faUsers,
    faCode,
    faCircle
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';

interface GitHubUser {
    login: string;
    name: string;
    avatar_url: string;
    bio: string;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
}

interface GitHubRepo {
    id: number;
    name: string;
    description: string;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    language: string;
    updated_at: string;
    topics: string[];
    fork: boolean;
}

const GitHubStatsPage = () => {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const username = 'yuliitezarygml';

    useEffect(() => {
        const fetchGitHubData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch user data
                const userResponse = await fetch(`https://api.github.com/users/${username}`);
                if (!userResponse.ok) throw new Error('Failed to fetch user data');
                const userData = await userResponse.json();
                setUser(userData);

                // Fetch repositories
                const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
                if (!reposResponse.ok) throw new Error('Failed to fetch repositories');
                const reposData = await reposResponse.json();

                // Filter out forks and sort by stars
                const filteredRepos = reposData
                    .filter((repo: GitHubRepo) => !repo.fork)
                    .sort((a: GitHubRepo, b: GitHubRepo) => b.stargazers_count - a.stargazers_count);

                setRepos(filteredRepos);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchGitHubData();
    }, []);

    const getLanguageColor = (language: string): string => {
        const colors: Record<string, string> = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#3178c6',
            'Python': '#3572A5',
            'Java': '#b07219',
            'C++': '#f34b7d',
            'C': '#555555',
            'C#': '#178600',
            'Go': '#00ADD8',
            'Rust': '#dea584',
            'PHP': '#4F5D95',
            'Ruby': '#701516',
            'Swift': '#ffac45',
            'Kotlin': '#A97BFF',
            'Dart': '#00B4AB',
            'HTML': '#e34c26',
            'CSS': '#563d7c',
            'Vue': '#41b883',
            'Shell': '#89e051'
        };
        return colors[language] || '#8b949e';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    // Get language statistics
    const languageStats = repos.reduce((acc, repo) => {
        if (repo.language) {
            acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const topLanguages = Object.entries(languageStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-primary text-theme-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Loading GitHub data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-theme-primary text-theme-primary flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-xl mb-4">Error: {error}</p>
                    <Link to="/" className="text-blue-400 hover:text-blue-300">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-theme-primary text-theme-primary">
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 left-0 right-0 z-40"
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                    backdropFilter: 'blur(40px) saturate(200%) brightness(110%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(110%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
            >
                <nav className="container-custom">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        <Link
                            to="/"
                            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="icon-keep-color" />
                            <span className="font-medium">Back to Home</span>
                        </Link>

                        <div className="text-xl md:text-2xl font-bold tracking-tight">
                            <span className="gradient-text">GitHub Stats</span>
                        </div>

                        <a
                            href={`https://github.com/${username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all duration-200 font-medium"
                        >
                            <FontAwesomeIcon icon={faGithub} />
                            <span className="hidden md:inline">View on GitHub</span>
                        </a>
                    </div>
                </nav>
            </motion.header>

            {/* Main Content */}
            <main className="pt-24 pb-16">
                <div className="container-custom">
                    {/* Profile Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <div className="bg-white/5 rounded-xl border border-white/10 p-8">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                <img
                                    src={user?.avatar_url}
                                    alt={user?.name}
                                    className="w-32 h-32 rounded-full border-4 border-white/20"
                                />
                                <div className="flex-1 text-center md:text-left">
                                    <h1 className="text-3xl font-bold text-white mb-2">{user?.name}</h1>
                                    <p className="text-xl text-gray-400 mb-4">@{user?.login}</p>
                                    <p className="text-gray-300 mb-4">{user?.bio}</p>
                                    <p className="text-sm text-gray-500">
                                        Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Statistics Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12"
                    >
                        <div className="bg-white/5 rounded-lg border border-white/10 p-6 text-center">
                            <FontAwesomeIcon icon={faBook} className="text-3xl text-blue-400 mb-3" />
                            <div className="text-2xl font-bold text-white mb-1">{user?.public_repos}</div>
                            <div className="text-sm text-gray-400">Repositories</div>
                        </div>

                        <div className="bg-white/5 rounded-lg border border-white/10 p-6 text-center">
                            <FontAwesomeIcon icon={faStar} className="text-3xl text-yellow-400 mb-3" />
                            <div className="text-2xl font-bold text-white mb-1">{totalStars}</div>
                            <div className="text-sm text-gray-400">Total Stars</div>
                        </div>

                        <div className="bg-white/5 rounded-lg border border-white/10 p-6 text-center">
                            <FontAwesomeIcon icon={faCodeFork} className="text-3xl text-green-400 mb-3" />
                            <div className="text-2xl font-bold text-white mb-1">{totalForks}</div>
                            <div className="text-sm text-gray-400">Total Forks</div>
                        </div>

                        <div className="bg-white/5 rounded-lg border border-white/10 p-6 text-center">
                            <FontAwesomeIcon icon={faUsers} className="text-3xl text-purple-400 mb-3" />
                            <div className="text-2xl font-bold text-white mb-1">{user?.followers}</div>
                            <div className="text-sm text-gray-400">Followers</div>
                        </div>

                        <div className="bg-white/5 rounded-lg border border-white/10 p-6 text-center">
                            <FontAwesomeIcon icon={faUsers} className="text-3xl text-pink-400 mb-3" />
                            <div className="text-2xl font-bold text-white mb-1">{user?.following}</div>
                            <div className="text-sm text-gray-400">Following</div>
                        </div>
                    </motion.div>

                    {/* Top Languages */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-12"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Top Languages</h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {topLanguages.map(([language, count]) => (
                                <div key={language} className="bg-white/5 rounded-lg border border-white/10 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FontAwesomeIcon
                                            icon={faCircle}
                                            className="text-xs"
                                            style={{ color: getLanguageColor(language) }}
                                        />
                                        <span className="text-white font-medium">{language}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{count}</div>
                                    <div className="text-sm text-gray-400">repositories</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Repositories */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Repositories ({repos.length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {repos.map((repo) => (
                                <motion.a
                                    key={repo.id}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/5 rounded-lg border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-white">{repo.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                                                {repo.stargazers_count}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FontAwesomeIcon icon={faCodeFork} className="text-green-400" />
                                                {repo.forks_count}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                        {repo.description || 'No description available'}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {repo.language && (
                                                <span className="flex items-center gap-1 text-sm text-gray-300">
                                                    <FontAwesomeIcon
                                                        icon={faCircle}
                                                        className="text-xs"
                                                        style={{ color: getLanguageColor(repo.language) }}
                                                    />
                                                    {repo.language}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            Updated {formatDate(repo.updated_at)}
                                        </span>
                                    </div>

                                    {repo.topics && repo.topics.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {repo.topics.slice(0, 3).map((topic) => (
                                                <span
                                                    key={topic}
                                                    className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20"
                                                >
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default GitHubStatsPage;
