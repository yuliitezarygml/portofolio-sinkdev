// Утилиты для оптимизированных анимаций

// Определяем предпочтения пользователя по анимациям
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Определяем мобильное устройство
export const isMobileDevice = () => {
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Определяем iOS устройство
export const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
};

// Определяем Chrome на iOS (проблемный браузер)
export const isIOSChrome = () => {
  return isIOSDevice() && /CriOS/.test(navigator.userAgent);
};

// Оптимизированные варианты анимаций
export const getOptimizedVariants = () => {
  const shouldReduceMotion = prefersReducedMotion();
  const isMobile = isMobileDevice();
  const isIOS = isIOSDevice();
  const isIOSChr = isIOSChrome();
  
  if (shouldReduceMotion) {
    return {
      containerVariants: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } }
      },
      itemVariants: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } }
      },
      buttonVariants: {
        hover: { scale: 1 },
        tap: { scale: 1 }
      }
    };
  }

  // Специальная оптимизация для iOS Chrome
  if (isIOSChr) {
    return {
      containerVariants: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
            duration: 0.2
          }
        }
      },
      itemVariants: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
        }
      },
      buttonVariants: {
        hover: { scale: 1 },
        tap: { scale: 0.99 }
      }
    };
  }

  if (isIOS || isMobile) {
    return {
      containerVariants: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
            duration: 0.3
          }
        }
      },
      itemVariants: {
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
        }
      },
      buttonVariants: {
        hover: { scale: 1.01 },
        tap: { scale: 0.99 }
      }
    };
  }

  // Полные анимации для десктопа
  return {
    containerVariants: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
          delayChildren: 0.3,
          duration: 0.6
        }
      }
    },
    itemVariants: {
      hidden: { opacity: 0, y: 50 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
      }
    },
    buttonVariants: {
      hover: { scale: 1.05 },
      tap: { scale: 0.95 }
    }
  };
};

// Переходы для страниц
export const getPageTransition = () => {
  const shouldReduceMotion = prefersReducedMotion();
  const isMobile = isMobileDevice();

  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    };
  }

  if (isMobile) {
    return {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
    };
  }

  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  };
};

// Оптимизированные настройки для Framer Motion
export const getMotionConfig = () => ({
  reducedMotion: "user",
  features: {
    animations: !prefersReducedMotion(),
    layout: !isMobileDevice()
  }
});