import { useEffect, useMemo, useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView, useMotionValue } from "framer-motion";
import type { Variants } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import {
  PawPrint,
  Heart,
  Shield,
  Users,
  Award,
  Target,
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  Eye,
  Zap,
} from "lucide-react";

/**
 * Simple ImageWithFallback used across this page to avoid missing component errors.
 * Accepts all native <img> props plus an optional fallbackSrc to swap to on error.
 */
function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  ...rest
}: JSX.IntrinsicElements["img"] & { fallbackSrc?: string }) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src as string | undefined);

  return (
    <img
    
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (fallbackSrc && imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
      {...rest}
    />
  );
}

type AboutContent = {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  stats: { value: number; label: string; suffix?: string }[];
  values: { icon: keyof typeof iconMap; title: string; description: string }[];
  highlights: string[];
  milestones: { year: string; title: string; description: string }[];
  vision: {
    title: string;
    subtitle: string;
    points: { icon: keyof typeof visionIconMap; title: string; description: string }[];
  };
};

const iconMap = {
  Heart,
  Shield,
  Users,
  Award,
} as const;

const visionIconMap = {
  Sparkles,
  TrendingUp,
  Eye,
  Zap,
} as const;

const defaultContent: AboutContent = {
  hero: {
    badge: "About PawStay",
    title: "Professional Pet Care, Delivered with Heart",
    subtitle:
      "PawStay connects pet parents with verified, caring providers—backed by 24/7 support, secure payments, and transparent reviews.",
    primaryCta: { label: "Explore Services", href: "/hotels" },
    secondaryCta: { label: "List Your Property", href: "/signin?intent=partner&mode=signup&redirect=/list-property" },
  },
  stats: [
    { value: 2500, label: "Pet Hotels", suffix: "+" },
    { value: 500, label: "Happy Pets", suffix: "K+" },
    { value: 50, label: "Pet Parents", suffix: "K+" },
    { value: 15, label: "Countries", suffix: "+" },
  ],
  values: [
    {
      icon: "Heart",
      title: "Pet-First Approach",
      description:
        "Every policy, design choice, and partner is evaluated for comfort, safety, and wellbeing.",
    },
    {
      icon: "Shield",
      title: "Trust & Safety",
      description: "We verify providers, review documents, and monitor stays for consistent quality.",
    },
    {
      icon: "Users",
      title: "Community",
      description: "We build connections between pet parents and passionate caregivers worldwide.",
    },
    {
      icon: "Award",
      title: "Excellence",
      description: "We continuously improve our platform through data, feedback, and service innovation.",
    },
  ],
  highlights: [
    "Verified providers and secure onboarding",
    "Photo and video updates during stays",
    "Flexible booking and cancellation",
    "24/7 support with local escalation",
  ],
  milestones: [
    {
      year: "2020",
      title: "Founded",
      description: "Launched the first PawStay marketplace with 120 trusted providers.",
    },
    {
      year: "2022",
      title: "Growth",
      description: "Expanded to 15+ countries and launched secure payments.",
    },
    {
      year: "2024",
      title: "Innovation",
      description: "Released smart matching and real-time stay updates.",
    },
    {
      year: "2026",
      title: "Future",
      description: "Scaling our network for next-generation pet care.",
    },
  ],
  vision: {
    title: "Our Vision for the Future",
    subtitle: "Transforming pet care into a seamless, trusted, and joyful experience for every pet parent worldwide.",
    points: [
      {
        icon: "Sparkles",
        title: "AI-Powered Matching",
        description: "Intelligent algorithms that pair pets with their perfect caregivers based on personality, needs, and preferences.",
      },
      {
        icon: "TrendingUp",
        title: "Global Expansion",
        description: "Building the world's largest trusted network of pet care providers across 100+ countries by 2028.",
      },
      {
        icon: "Eye",
        title: "Real-Time Transparency",
        description: "Live updates, HD cameras, and health monitoring so parents never miss a moment of their pet's stay.",
      },
      {
        icon: "Zap",
        title: "Instant Booking",
        description: "One-tap reservations with verified availability, instant confirmations, and flexible scheduling.",
      },
    ],
  },
};

// Animation variants with enhanced easing
const easing = [0.22, 1, 0.36, 1] as const;
const bounceEasing = [0.34, 1.56, 0.64, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: easing },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1, ease: easing },
  },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: easing },
  },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: easing },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const staggerFast = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: easing },
  },
};

const scaleRotate = {
  hidden: { opacity: 0, scale: 0.7, rotate: -15 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.8, ease: bounceEasing },
  },
};

const slideUpBounce = {
  hidden: { opacity: 0, y: 80 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: bounceEasing,
    },
  },
};

const pop = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: bounceEasing,
    },
  },
};

// Counter animation hook
function useCounter(target: number, duration: number = 2) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth acceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(target * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, isInView]);

  return { count, ref };
}

type StatItem = AboutContent["stats"][number];

const StatsCard = ({ stat, index }: { stat: StatItem; index: number }) => {
  const { count, ref } = useCounter(stat.value, 2.5);

  return (
    <motion.div
      ref={ref}
      variants={slideUpBounce}
      whileHover={{
        y: -12,
        scale: 1.05,
        rotateY: 5,
        transition: { duration: 0.3 },
      }}
      className="rounded-3xl bg-gradient-card p-8 text-center shadow-card transition-all duration-300 hover:shadow-elevated border border-border/50"
    >
      <motion.div
        className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2"
        initial={{ scale: 0.5 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.1 + 0.4, ease: bounceEasing }}
      >
        {count}
        {stat.suffix}
      </motion.div>
      <p className="text-muted-foreground font-medium">{stat.label}</p>
    </motion.div>
  );
};

const About = () => {
  const [content, setContent] = useState<AboutContent>(defaultContent);
  const heroRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.6, 0.2]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/about.json", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : defaultContent))
      .then((data: Partial<AboutContent>) =>
        setContent({
          ...defaultContent,
          ...data,
          hero: { ...defaultContent.hero, ...data.hero },
          vision: {
            ...defaultContent.vision,
            ...data.vision,
            points: data.vision?.points ?? defaultContent.vision.points,
          },
          values: data.values ?? defaultContent.values,
          stats: data.stats ?? defaultContent.stats,
          highlights: data.highlights ?? defaultContent.highlights,
          milestones: data.milestones ?? defaultContent.milestones,
        })
      )
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const valuesWithIcons = useMemo(
    () =>
      content.values.map((value) => ({
        ...value,
        Icon: iconMap[value.icon],
      })),
    [content.values]
  );

  const visionWithIcons = useMemo(
    () =>
      content.vision.points.map((point) => ({
        ...point,
        Icon: visionIconMap[point.icon],
      })),
    [content.vision.points]
  );

  // Mouse tracking for parallax effects
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) / 20);
    mouseY.set((e.clientY - rect.top - rect.height / 2) / 20);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section - No Video, Pure Gradient Animation */}
        <section ref={heroRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0"
            style={{
              y: heroY,
              scale: heroScale,
              opacity: heroOpacity,
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            {/* Floating orbs */}
            <motion.div
              className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl"
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
              animate={{
                x: [0, -80, 0],
                y: [0, -60, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/15 rounded-full blur-2xl"
              animate={{
                x: [-50, 50, -50],
                y: [-50, 50, -50],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          <div className="container relative z-10 py-20">
            <motion.div
              className="max-w-4xl mx-auto text-center space-y-8"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              onMouseMove={handleMouseMove}
            >
              <motion.div
                variants={pop}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary text-sm font-semibold backdrop-blur-xl border border-primary/20 shadow-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <PawPrint className="h-5 w-5" />
                </motion.div>
                {content.hero.badge}
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight"
                style={{
                  x: mouseX,
                  y: mouseY,
                }}
              >
                {content.hero.title}
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              >
                {content.hero.subtitle}
              </motion.p>

              {/* Artistic dog images - floating */}
              <motion.div 
                className="absolute top-10 right-4 md:right-8 lg:right-16 hidden md:block"
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [-2, 2, -2] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-[32vw] max-w-48 lg:max-w-56 aspect-square rounded-full overflow-hidden border-4 border-primary/30 shadow-glow"
                >
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1762110098942-f967f5c08fd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGggbGRlbiUyMHJldHJpZXZlciUyMHBldCUyMGNhcmV8ZW58MXx8fHwxNzcwMjEzMjg5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Happy golden retriever"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </motion.div>

              <motion.div 
                className="absolute bottom-32 left-10 hidden md:block"
                initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [2, -2, 2] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-[24vw] max-w-36 lg:max-w-40 aspect-square rounded-2xl overflow-hidden border-4 border-accent/30 shadow-xl"
                >
                 <ImageWithFallback
                    src="https://images.unsplash.com/photo-1586796304259-5fa44d5e3f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxzbWFsbCUyMGRvZyUyMHBvcnRyYWl0JTIwd2hpdGV8ZW58MXx8fHwxNzcwMjEzMjkyfDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Cute small dog"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 pt-4">
                <a href={content.hero.primaryCta.href}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="hero" size="xl" className="gap-2 group shadow-glow">
                      {content.hero.primaryCta.label}
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </a>
                <a href={content.hero.secondaryCta.href}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="xl"
                      className="border-foreground/20 hover:border-primary/40 transition-all duration-300 backdrop-blur-sm"
                    >
                      {content.hero.secondaryCta.label}
                    </Button>
                  </motion.div>
                </a>
              </motion.div>

              <motion.div
                variants={staggerFast}
                className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground pt-8"
              >
                {content.highlights.map((item, i) => (
                  <motion.span
                    key={item}
                    variants={pop}
                    whileHover={{ y: -4, scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-5 py-3 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:bg-background/90"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    >
                      <Check className="h-4 w-4 text-success" />
                    </motion.div>
                    {item}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats with Counter Animation */}
        <section className="py-20 bg-gradient-to-b from-card/70 to-background border-y border-border relative overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
            animate={{
              backgroundPosition: ["0px 0px", "40px 40px"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <div className="container relative">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {content.stats.map((stat, i) => (
                <StatsCard key={stat.label} stat={stat} index={i} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Vision Section - NEW */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          />
          
          {/* Animated grid background */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
            animate={{
              backgroundPosition: ["0px 0px", "50px 50px"],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="container relative">
            <motion.div
              className="text-center mb-16 max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div
                variants={scaleRotate}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-accent text-accent-foreground mb-6 shadow-glow"
              >
                <Sparkles className="h-8 w-8" />
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6"
              >
                {content.vision.title}
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-xl text-muted-foreground leading-relaxed"
              >
                {content.vision.subtitle}
              </motion.p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerFast}
            >
              {visionWithIcons.map((point, i) => (
                <motion.div
                  key={point.title}
                  variants={fadeInUp}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                    rotateZ: i % 2 === 0 ? 1 : -1,
                    transition: { duration: 0.3 },
                  }}
                  className="group relative rounded-3xl bg-card p-8 shadow-card hover:shadow-elevated transition-all duration-500 border border-border/50 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  
                  <div className="relative">
                    <motion.div
                      className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-gradient-hero transition-all duration-300"
                      whileHover={{ scale: 1.15, rotate: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <point.Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </motion.div>
                    <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
                      {point.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 md:py-24 relative overflow-hidden bg-secondary/20">
          <motion.div
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          
          <div className="container relative">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                className="space-y-8"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.div
                  variants={scaleRotate}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg"
                >
                  <Target className="h-8 w-8" />
                </motion.div>
                <motion.h2
                  variants={fadeInLeft}
                  className="font-display text-4xl md:text-5xl font-bold text-foreground"
                >
                  Our Mission
                </motion.h2>
                <motion.p
                  variants={fadeInLeft}
                  className="text-xl text-muted-foreground leading-relaxed"
                >
                  To create a world where finding trusted, quality care for your pet is as easy as
                  booking a hotel for yourself. We blend verified providers, smart matching, and
                  round-the-clock support so pet parents can book with total confidence.
                </motion.p>
                <motion.div
                  variants={fadeInLeft}
                  whileHover={{ scale: 1.03, x: 8 }}
                  className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/5 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-primary/40"
                >
                  <p className="text-sm font-semibold text-foreground mb-2">What this means for you</p>
                  <p className="text-sm text-muted-foreground">
                    Faster approvals, curated listings, and clear standards that keep every stay safe
                    and joyful.
                  </p>
                </motion.div>
              </motion.div>

              <motion.div
                className="grid gap-5"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerFast}
              >
                {content.milestones.map((item, i) => (
                  <motion.div
                    key={item.year}
                    variants={fadeInRight}
                    whileHover={{
                      x: 12,
                      scale: 1.03,
                      rotate: 0.5,
                      transition: { duration: 0.3 },
                    }}
                    className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft hover:shadow-elevated hover:border-primary/40 transition-all duration-300"
                  >
                    <motion.div
                      className="inline-block text-sm font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-3"
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                    >
                      {item.year}
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            initial={{ opacity: 0, x: 100, y: -100, scale: 0.5 }}
            whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
            initial={{ opacity: 0, x: -100, y: 100, scale: 0.5 }}
            whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          
          <div className="container relative">
            <motion.div
              className="text-center mb-16 max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideUpBounce}
            >
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Our Values
              </h2>
              <p className="text-xl text-muted-foreground">
                The principles that guide everything we do
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {valuesWithIcons.map((value, i) => (
                <motion.div
                  key={value.title}
                  variants={slideUpBounce}
                  whileHover={{
                    y: -16,
                    scale: 1.05,
                    rotate: i % 2 === 0 ? 2 : -2,
                    transition: { duration: 0.4, ease: "easeOut" },
                  }}
                  className="group bg-gradient-card rounded-3xl p-8 shadow-card hover:shadow-elevated transition-all duration-500 border border-border/50"
                >
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mb-5 group-hover:from-primary group-hover:to-primary/80 transition-all duration-300"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.25, rotate: 15 }}
                  >
                    <value.Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  </motion.div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <motion.section
          className="py-24 md:py-32 bg-gradient-hero relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 2px, transparent 2px)",
              backgroundSize: "60px 60px",
            }}
          />
          
          <div className="container text-center relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto space-y-8"
            >
              <motion.h2
                variants={fadeInUp}
                className="font-display text-4xl md:text-5xl font-bold text-primary-foreground"
              >
                Ready to Join the PawStay Family?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-xl text-primary-foreground/90 leading-relaxed"
              >
                Whether you're a pet parent looking for care or a provider wanting to join our network.
              </motion.p>
              <motion.div
                className="flex flex-wrap justify-center gap-4 pt-4"
                variants={staggerFast}
              >
                <motion.div variants={pop}>
                  <a href="/hotels">
                    <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="secondary"
                        size="xl"
                        className="shadow-elevated hover:shadow-glow"
                      >
                        Find Pet Care
                      </Button>
                    </motion.div>
                  </a>
                </motion.div>
                <motion.div variants={pop}>
                  <a href="/signin?intent=partner&mode=signup&redirect=/list-property">
                    <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="xl"
                        className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20 backdrop-blur-sm"
                      >
                        List Your Property
                      </Button>
                    </motion.div>
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </div>
  );
};

export default About;