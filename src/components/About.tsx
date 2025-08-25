import { motion } from 'framer-motion';
import { Code, Palette, Database, Wrench, GraduationCap, Briefcase, Calendar, Award } from 'lucide-react';

interface Skill {
  category: string;
  icon: React.ElementType;
  skills: string[];
  color: string;
}

interface TimelineItem {
  id: string;
  title: string;
  organization: string;
  period: string;
  description: string;
  technologies?: string[];
}

interface Timeline {
  education: TimelineItem[];
  work: TimelineItem[];
  certificates: TimelineItem[];
}

const About = () => {
  // Timeline data - replace with your actual education and work history
  const timeline: Timeline = {
    education: [
      {
        id: 'edu1',
        title: 'Scoala Profesionala 5 - Balti',
        organization: 'Operator pentru suportul tehnic al calculatoarelor – Operator introducere, validare și prelucrare date (3 ani)',
        period: '2020 - 2023',
        description: 'Specialist în suport tehnic IT și prelucrarea datelor, cu experiență în întreținerea calculatoarelor, configurarea rețelelor, instalarea software-ului și operarea bazelor de date. Competențe solide în introducerea, validarea și securizarea informației digitale.',
        // technologies: ['C++', 'Python', 'JavaScript', 'Database Design']
      },
      {
        id: 'edu2',
        title: 'colegiu politehnic balti',
        organization: '61110 Calculatoare',
        period: '2023 - 2025',
        description: 'Specialist în suport IT și programare, cu abilități în testarea și repararea calculatoarelor, utilizarea sistemelor de operare Windows/MS-DOS, procesarea documentelor (Word, Excel), gestionarea bazelor de date (Access, FoxPro) și programare în Assembler, C++, C#,  HTML . Experiență în administrarea rețelelor locale și utilizarea Internetului..',
        technologies: ['HTML', 'c#', 'c++']
      },
       {
        id: 'edu3',
        title: 'CLUBUL ТINERILOR MAKERI',
        organization: '61110 Calculatoare',
        period: '2023 - 2025',
        description: 'Specialist în suport IT și programare, cu abilități în testarea și repararea calculatoarelor, utilizarea sistemelor de operare Windows/MS-DOS, procesarea documentelor (Word, Excel), gestionarea bazelor de date (Access, FoxPro) și programare în Assembler, C++, C#,  HTML . Experiență în administrarea rețelelor locale și utilizarea Internetului..',
        technologies: ['HTML', 'c#', 'c++']
      }
    ],
    work: [
      {
        id: 'work1',
        title: 'Tekwill Academy Kids',
        organization: 'Tekwill Academy Kids',
        period: '2023 - Present',
        description: 'Mentored 10–11 y.o. kids in robotics, teaching basics of coding, sensors, and electronics.',
        technologies: ['Scratch']
      },
      {
        id: 'work2',
        title: 'Community house',
        organization: 'Mentor web developer si photosop desing',
        period: '2023',
        description: 'Am instruit copii  în crearea site-urilor web și design grafic în Photoshop, dezvoltându-le creativitatea și competențele digitale de bază..',
        technologies: ['Photosop', 'hrml', 'css']
      }
    ],
    certificates: [
     {
        id: 'cert1',
        title: 'Networking Fundamentals',
        organization: 'Școala Profesională Nr. 5 Bălți',
        period: '2023',
        description: 'Cunoștințe fundamentale despre rețele de calculatoare, protocoale de comunicație și infrastructură (TCP/IP, DNS, DHCP).',
        technologies: ['TCP/IP', 'Networking', 'DNS', 'DHCP']
      },
      {
        id: 'cert2',
        title: 'Drone și Aparat de Zbor',
        organization: 'Clubul Tinerilor Makeri',
        period: '2023',
        description: 'Formare practică în operarea dronelor și aparatelor de zbor, cu accent pe siguranță, control și aplicații reale.',
        technologies: ['Drone', 'Flight Control', 'Aeronavigation']
      },
      {
        id: 'cert3',
        title: 'Introducere în 3D și Imprimare 3D',
        organization: 'Clubul Tinerilor Makeri',
        period: '2023',
        description: 'Bazele modelării 3D și utilizării imprimantelor 3D pentru prototipare și producție rapidă.',
        technologies: ['3D Printing', 'Modelare 3D', 'Prototyping']
      },
      {
        id: 'cert4',
        title: 'Electronică și Programare',
        organization: 'Clubul Tinerilor Makeri',
        period: '2023',
        description: 'Noțiuni fundamentale de electronică și programare integrate în proiecte practice cu senzori și microcontrolere.',
        technologies: ['Electronics', 'Programming', 'Sensors']
      },
      {
        id: 'cert5',
        title: 'Modelare 3D și Tăiere Laser',
        organization: 'Clubul Tinerilor Makeri',
        period: '2023',
        description: 'Abilități în proiectare 3D și utilizarea mașinilor de tăiat cu laser pentru fabricarea de componente personalizate.',
        technologies: ['Laser Cutting', '3D Design', 'Digital Fabrication']
      },
      {
        id: 'cert6',
        title: 'Robotică și Mecatronică',
        organization: 'Clubul Tinerilor Makeri',
        period: '2023',
        description: 'Construirea și programarea sistemelor mecatronice, îmbinând mecanica, electronică și software.',
        technologies: ['Robotics', 'Mechatronics', 'STEM']
      },
      {
        id: 'cert7',
        title: 'ODA – Start pentru Tineri',
        organization: 'Organizația pentru Dezvoltarea Antreprenoriatului (ODA)',
        period: '2023',
        description: 'Program de inițiere în antreprenoriat dedicat tinerilor, axat pe dezvoltarea afacerilor proprii și gândire strategică.',
        technologies: ['Startup', 'Business Planning', 'Entrepreneurship']
      }
    ]
  };

  const skills: Skill[] = [
    {
      category: 'Languages',
      icon: Code,
      skills: ['Python', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Lua', 'HTML', 'CSS3'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      category: 'Frontend',
      icon: Palette,
      skills: ['React', 'Next.js', 'Tailwind CSS', 'HTML5', 'CSS3', 'JavaScript', 'Vite'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      category: 'Backend',
      icon: Database,
      skills: ['Node.js', 'Express.js', 'Python', 'Flask', 'MySQL', 'MongoDB'],
      color: 'from-green-500 to-emerald-500'
    },
    {
      category: 'Tools & Systems',
      icon: Wrench,
      skills: ['Git', 'Docker', 'Linux', 'Windows'],
      color: 'from-orange-500 to-red-500'
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

  const skillCardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  };

  // Timeline component
  const TimelineSection = ({ items, title, icon }: { items: TimelineItem[], title: string, icon: React.ElementType }) => {
    const Icon = icon;
    
    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
        </div>
        
        <div className="space-y-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="relative pl-8 border-l-2 border-white/20 last:border-l-0 last:pb-0 pb-6"
            >
              {/* Timeline dot */}
              <div className="absolute -left-2 top-0 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6 hover:bg-white/10 transition-all duration-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-blue-400 mt-1 md:mt-0">
                    <Calendar className="w-4 h-4" />
                    <span>{item.period}</span>
                  </div>
                </div>
                
                <p className="text-purple-300 font-medium mb-2">{item.organization}</p>
                <p className="text-gray-300 mb-4 leading-relaxed">{item.description}</p>
                
                {item.technologies && (
                  <div className="flex flex-wrap gap-2">
                    {item.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md border border-blue-500/30"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="about" className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 gradient-text">
            About Me
          </h2>
          <p className="text-base md:text-xl text-gray-400 max-w-3xl mx-auto">
            Passionate developer with 3-4 years of experience, creating projects for fun and managing active communities
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* About Text */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="space-y-4 md:space-y-6">
              <motion.p 
                variants={itemVariants} 
                className="text-base md:text-lg text-gray-300 leading-relaxed"
              >
                I'm yuliitezary, a passionate developer with <span className="text-white font-medium">3-4 years of experience</span> in 
                software development. I work with multiple programming languages and modern technologies.
              </motion.p>
              
              <motion.p 
                variants={itemVariants} 
                className="text-base md:text-lg text-gray-300 leading-relaxed"
              >
                I manage active communities: while developing projects like SWA Cloud.
              </motion.p>
              
              <motion.p 
                variants={itemVariants} 
                className="text-base md:text-lg text-gray-300 leading-relaxed"
              >
                I code for <span className="text-white font-medium">fun</span> and take on 
                <span className="text-white font-medium"> freelance projects</span> when orders come in.
              </motion.p>
            </div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-3 md:gap-6 mt-8 md:mt-12 p-4 md:p-6 glass-bg rounded-2xl"
            >
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">3-4</div>
                <div className="text-xs md:text-sm text-gray-400">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">10+</div>
                <div className="text-xs md:text-sm text-gray-400">Languages & Tools</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">2</div>
                <div className="text-xs md:text-sm text-gray-400">Active Communities</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Skills Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4 md:space-y-6"
          >
            {skills.map((skill, index) => (
              <motion.div
                key={skill.category}
                variants={skillCardVariants}
                className="border-l-2 border-white/10 pl-4 md:pl-6 py-3 md:py-4"
              >
                {/* Category Header */}
                <h3 className="text-base md:text-lg font-semibold text-white mb-2 md:mb-3">
                  {skill.category}
                </h3>
                
                {/* Skills List */}
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {skill.skills.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 md:px-3 py-1 bg-white/5 text-gray-300 text-xs md:text-sm rounded-md border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Timeline Sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 md:mt-24"
        >
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12">
            {/* Education Timeline */}
            <div>
              <TimelineSection 
                items={timeline.education} 
                title="Education" 
                icon={GraduationCap} 
              />
            </div>

            {/* Work Experience Timeline */}
            <div>
              <TimelineSection 
                items={timeline.work} 
                title="Work Experience" 
                icon={Briefcase} 
              />
            </div>

            {/* Certificates Timeline */}
            <div className="md:col-span-2 xl:col-span-1">
              <TimelineSection 
                items={timeline.certificates} 
                title="Certificates" 
                icon={Award} 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;