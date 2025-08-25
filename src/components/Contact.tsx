import { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDiscord, 
  faTelegramPlane, 
  faGithub, 
  faSteam 
} from '@fortawesome/free-brands-svg-icons';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reset form
    setFormData({ name: '', email: '', message: '' });
    setIsSubmitting(false);
    
    // Show success message (in a real app, you'd handle this properly)
    alert('Message sent! Thank you for reaching out.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const socialLinks = [
    {
      name: 'Discord',
      icon: faDiscord,
      href: 'https://discord.com/users/1256652881751441498/',
      color: 'from-indigo-500 to-purple-600',
      description: 'yuliitezary#1234'
    },
    {
      name: 'Telegram',
      icon: faTelegramPlane,
      href: 'https://t.me/yuliitezary',
      color: 'from-blue-400 to-blue-600',
      description: '@yuliitezary'
    },
    {
      name: 'GitHub',
      icon: faGithub,
      href: 'https://github.com/yuliitezarygml',
      color: 'from-gray-600 to-gray-800',
      description: 'github.com/yuliitezarygml'
    },
    {
      name: 'Steam',
      icon: faSteam,
      href: 'https://steamcommunity.com/id/yuliitezary/',
      color: 'from-blue-600 to-indigo-700',
      description: 'steamcommunity.com/id/yuliitezary'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
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
    <section id="contact" className="section-padding bg-zinc-950/50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Let's Connect
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Ready to start a project or just want to say hello?
            </p>
          </motion.div>

          {/* Contact Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            {socialLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1 }
                }}
                className="group p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${link.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <FontAwesomeIcon icon={link.icon} className="text-white icon-keep-color" />
                </div>
                <h3 className="font-medium text-white text-sm mb-1">
                  {link.name}
                </h3>
                <p className="text-xs text-gray-500 leading-tight">
                  {link.description.replace('yuliitezary#1234', '@yuliitezary').replace('github.com/yuliitezarygml', 'yuliitezarygml').replace('steamcommunity.com/id/yuliitezary', 'yuliitezary')}
                </p>
              </motion.a>
            ))}
          </motion.div>

          {/* Bottom Text */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-gray-500"
          >
            Usually respond within 24 hours
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default Contact;