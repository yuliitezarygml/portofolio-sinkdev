import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faTelegramPlane, faGithub, faSteam } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  const socialLinks = [
    {
      name: 'GitHub',
      icon: faGithub,
      href: 'https://github.com/yuliitezarygml',
      color: 'hover:text-gray-300'
    },
    {
      name: 'Discord',
      icon: faDiscord,
      href: 'https://discord.com/users/1256652881751441498/',
      color: 'hover:text-indigo-400'
    },
    {
      name: 'Telegram',
      icon: faTelegramPlane,
      href: 'https://t.me/yuliitezary',
      color: 'hover:text-blue-400'
    },
    {
      name: 'Steam',
      icon: faSteam,
      href: 'https://steamcommunity.com/id/yuliitezary/',
      color: 'hover:text-blue-500'
    }
  ];

  const communities = [
    {
      // name: 'GFK Discord',
      // href: 'https://discord.gg/aVhPxXNC3m',
      // description: 'Active community server'
    },
    {
          // name: 'LightCloud',
          // href: 'https://t.me/gfklightcloud',
          // description: 'Telegram channel'
    }
  ];


  return (
    <footer className="relative bg-theme-secondary border-t border-theme">

      <div className="relative container-custom">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          {/* Mobile Layout */}
          <div className="block md:hidden space-y-8">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold gradient-text mb-3">SinkDev</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Passionate developer building modern solutions and managing active communities.
              </p>
              
              {/* Social Links */}
              <div className="flex justify-center gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors touch-manipulation"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                    aria-label={link.name}
                  >
                    <FontAwesomeIcon icon={link.icon} className="text-lg icon-keep-color" />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 gap-6 text-center">
              {/* Communities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h4 className="text-lg font-semibold text-white mb-4">Communities</h4>
                <div className="space-y-3">
                  {communities.map((community) => (
                    <a
                      key={community.name}
                      href={community.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group touch-manipulation"
                      style={{ minHeight: '44px' }}
                    >
                      <div className="text-gray-300 group-hover:text-white font-medium transition-colors text-sm">
                        {community.name}
                      </div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                        {community.description}
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Projects */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h4 className="text-lg font-semibold text-white mb-4">Projects</h4>
                <div className="space-y-3">
                  <a
                    href="https://swacloud.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group touch-manipulation"
                    style={{ minHeight: '44px' }}
                  >
                    <div className="text-gray-300 group-hover:text-white font-medium transition-colors text-sm">
                      SWA Cloud
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                      Cloud platform
                    </div>
                  </a>
                  <a
                    href="https://github.com/yuliitezarygml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group touch-manipulation"
                    style={{ minHeight: '44px' }}
                  >
                    <div className="text-gray-300 group-hover:text-white font-medium transition-colors text-sm">
                      More Projects
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                      On GitHub
                    </div>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid lg:grid-cols-4 md:grid-cols-2 gap-12">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="mb-6">
                <h3 className="text-3xl font-bold gradient-text mb-4">SinkDev</h3>
                <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                  Passionate developer building modern solutions and managing active communities. 
                  Always learning, always creating.
                </p>
              </div>
              
              {/* Social Links */}
              <div className="flex gap-4">
                {socialLinks.map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 ${link.color} transition-all duration-300 hover:bg-white/10 hover:border-white/20`}
                    aria-label={link.name}
                  >
                    <FontAwesomeIcon icon={link.icon} className="text-xl icon-keep-color" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Communities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-xl font-semibold text-white mb-6">Communities</h4>
              <div className="space-y-4">
                {communities.map((community) => (
                  <motion.a
                    key={community.name}
                    href={community.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 5 }}
                    className="block group"
                  >
                    <div className="text-gray-300 group-hover:text-white font-medium transition-colors">
                      {community.name}
                    </div>
                    <div className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                      {community.description}
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-xl font-semibold text-white mb-6">Projects</h4>
              <div className="space-y-4">
                <motion.a
                  href="https://swacloud.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ x: 5 }}
                  className="block group"
                >
                  <div className="text-gray-300 group-hover:text-white font-medium transition-colors">
                    SWA Cloud
                  </div>
                  <div className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                    Cloud platform
                  </div>
                </motion.a>
                <motion.a
                  href="https://github.com/yuliitezarygml"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ x: 5 }}
                  className="block group"
                >
                  <div className="text-gray-300 group-hover:text-white font-medium transition-colors">
                    More Projects
                  </div>
                  <div className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                    On GitHub
                  </div>
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-6 md:py-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-xs md:text-sm text-gray-500"
          >
            <div>&copy; 2025 SinkDev. All rights reserved.</div>
            <div className="hidden md:block mt-1">Made with ❤️ and React</div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;