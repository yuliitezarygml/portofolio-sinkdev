import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faDiscord, faTelegramPlane } from '@fortawesome/free-brands-svg-icons';
import { faArrowDown, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { getOptimizedVariants } from '../utils/animations';

const Hero = () => {
  const scrollToProjects = () => {
    const element = document.querySelector('#projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { containerVariants, itemVariants, buttonVariants } = getOptimizedVariants();

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-theme-primary">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-transparent to-gray-800/20 dark:from-zinc-900/30 dark:via-transparent dark:to-zinc-800/20"></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container-custom relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
          >
            <span className="gradient-text">yuliitezary</span>
            <br />
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-theme-secondary mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Passionate developer with 3-4 years of experience. Building projects for fun and profit, 
            working with modern technologies and managing active communities.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <motion.button
              onClick={scrollToProjects}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-black font-semibold rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              View Projects
              <FontAwesomeIcon icon={faArrowDown} className="icon-keep-color" />
            </motion.button>
            
            <motion.a
              href="https://t.me/yuliitezary"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
            >
              Contact Me
              <FontAwesomeIcon icon={faEnvelope} className="icon-keep-color" />
            </motion.a>
          </motion.div>

          {/* Social Links */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-6"
          >
            {[
              { icon: faGithub, href: 'https://github.com/yuliitezarygml', label: 'GitHub' },
              { icon: faDiscord, href: 'https://discord.com/users/1256652881751441498/', label: 'Discord' },
              { icon: faTelegramPlane, href: 'https://t.me/yuliitezary', label: 'Telegram' },
            ].map(({ icon, href, label }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 group"
                aria-label={label}
              >
                <FontAwesomeIcon icon={icon} className="text-xl group-hover:text-white transition-colors icon-keep-color" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2"></div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;