import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  
  const targetText = 'root@sinkdev:~$';
  
  const hackerCommands = [
    { cmd: '$ initializing quantum core...', status: 'EXEC', color: 'text-blue-400' },
    { cmd: '$ injecting neural pathways...', status: 'OK', color: 'text-white' },
    { cmd: '$ bypassing firewall protocols...', status: 'OK', color: 'text-white' },
    { cmd: '$ compiling binary matrices...', status: 'OK', color: 'text-white' },
    { cmd: '$ decrypting server architecture...', status: 'OK', color: 'text-white' },
    { cmd: '$ activating neural networks...', status: 'OK', color: 'text-white' },
    { cmd: '$ launching cybernetic interface...', status: 'DONE', color: 'text-blue-400' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 5; // 100% / 20 intervals = 5% per 100ms = 2 seconds total
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const charsToType = Math.floor((progress / 100) * targetText.length);
    setTypedText(targetText.slice(0, charsToType));
    
    // Update current command based on progress
    const commandIndex = Math.min(
      Math.floor((progress / 100) * hackerCommands.length),
      hackerCommands.length - 1
    );
    setCurrentCommandIndex(commandIndex);
  }, [progress, targetText]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-theme-primary flex items-center justify-center loading-screen"
    >
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full grid-pattern"
        />
      </div>

      <div className="text-center relative z-10">
        {/* Typing Text */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-mono mb-4 tracking-wider">
            {typedText}
            {progress < 100 && (
              <motion.span
                animate={{
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-blue-400"
              >
                █
              </motion.span>
            )}
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: progress > 15 ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="text-theme-secondary text-lg font-mono"
          >
            {'<ACCESSING_MAINFRAME/>'}
          </motion.p>
        </div>

        {/* Hacker Terminal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: progress > 10 ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* Command execution */}
          <div className="text-left font-mono text-sm mb-6 space-y-2 glass-bg border border-white/10 p-4 rounded-lg backdrop-blur-xl">
            {hackerCommands.slice(0, currentCommandIndex + 1).map((command, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.3 }}
                className={`flex items-center justify-between ${command.color}`}
              >
                <span>{command.cmd}</span>
                <span className="text-xs px-2 py-1 bg-white/10 text-theme-secondary rounded border border-white/20">
                  [{command.status}]
                </span>
              </motion.div>
            ))}
            
            {/* Current executing command with blinking cursor */}
            {currentCommandIndex < hackerCommands.length - 1 && (
              <div className="flex items-center text-blue-400">
                <span>{hackerCommands[currentCommandIndex + 1]?.cmd}</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="ml-1"
                >
                  █
                </motion.span>
              </div>
            )}
          </div>
          
          {/* Binary data stream */}
          <div className="mb-4 font-mono text-xs text-theme-secondary/50 text-center break-all">
            {Array.from({ length: 64 }, (_, i) => (
              <span key={i} className={progress > (i / 64) * 100 ? 'text-blue-400' : 'text-theme-secondary/30'}>
                {Math.random() > 0.5 ? '1' : '0'}
              </span>
            ))}
          </div>
          
          {/* Site-style progress bar */}
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="text-blue-400">0x</span>
            <div className="flex-1 h-3 bg-white/10 border border-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
                className="h-full bg-gradient-to-r from-blue-400 to-white rounded-full relative"
                style={{
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </motion.div>
            </div>
            <span className="text-white w-16 text-right">
              {Math.floor(progress).toString(16).toUpperCase().padStart(2, '0')}%
            </span>
          </div>
          
          {/* Status indicators */}
          <div className="mt-4 flex justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-blue-400">SECURE CONNECTION</span>
            </div>
            <div className="text-theme-secondary">
              {progress > 90 ? 'ACCESS GRANTED' : 'INFILTRATING...'}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;