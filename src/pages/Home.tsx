import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Alumni Network",
    desc: "Connect with graduates working across industries worldwide.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    title: "Job Opportunities",
    desc: "Browse exclusive internships and jobs posted by alumni for students.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "Mentorship",
    desc: "Get career guidance from experienced alumni in your field of interest.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Events",
    desc: "Attend career fairs, alumni talks, and networking events on campus.",
  },
];

const stats = [
  { value: "10,000+", label: "Alumni" },
  { value: "5,000+", label: "Students" },
  { value: "2,500+", label: "Jobs Posted" },
  { value: "500+", label: "Events Held" },
];

const galleryImages = [
  { src: "/Slider-10.webp", alt: "Campus life", span: "md:col-span-2 md:row-span-2" },
  { src: "/mzc.webp", alt: "Students", span: "" },
  { src: "/background.webp", alt: "Graduation", span: "" },
  { src: "/students.webp", alt: "Alumni event", span: "md:col-span-2" },
];

const heroSlides = [
  {
    src: "/slide1.jpeg",
    eyebrow: "A network built around your next chapter",
    title: "Find your people.",
    emphasis: "Shape your future.",
    description: "One trusted space for students and alumni to exchange advice, discover opportunities, and stay connected long after graduation.",
  },
  {
    src: "/slide2.jpeg",
    eyebrow: "Your university community, in motion",
    title: "Turn conversations",
    emphasis: "into momentum.",
    description: "Meet experienced alumni, build meaningful relationships, and move from a question to a real next step.",
  },
  {
    src: "/slide3.jpeg",
    eyebrow: "Opportunity grows together",
    title: "Learn boldly.",
    emphasis: "Connect generously.",
    description: "From mentorship and jobs to events and peer support, make every connection count.",
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

const AnimatedSection = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const goToSlide = (index: number) => {
    setActiveSlide((index + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-lg py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <img
              src="/Logo-icon.png"
              alt="Alumni Connect Logo"
              className="h-9 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0"
            />
            <span
              className={`text-xl font-bold tracking-tight transition-colors duration-300 truncate ${
                scrolled ? "text-[#1e3a6e]" : "text-white"
              }`}
            >
              Alumni Connect
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              to="/login"
              className={`rounded-xl border transition-all duration-300 whitespace-nowrap flex items-center gap-2 px-4 py-2 sm:px-5 shadow-lg backdrop-blur-md ${
                scrolled
                  ? "bg-white border-[#1e3a6e]/15 text-[#1e3a6e] hover:shadow-xl hover:-translate-y-0.5"
                  : "bg-white/10 border-white/30 text-white hover:bg-white/20"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Crossfading image deck behind the hero content */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#102746]">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.src}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
              style={{
                backgroundImage: `url(${slide.src})`,
                transform: index === activeSlide ? "scale(1.08)" : "scale(1)",
                transition: "opacity 1000ms ease, transform 7000ms ease-out",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-[#071a30]/65" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071a30]/95 via-[#102746]/65 to-[#d2621a]/20" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px] animate-[drift_18s_linear_infinite]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <div key={activeSlide} className="animate-fade-in-up">
            <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-white/90 text-sm font-medium mb-6 backdrop-blur-sm">
              {heroSlides[activeSlide].eyebrow}
            </span>
          </div>

          <h1 key={`title-${activeSlide}`} className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up delay-100">
            {heroSlides[activeSlide].title}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f0a35c] to-[#d2621a]">
              {heroSlides[activeSlide].emphasis}
            </span>
          </h1>

          <p key={`description-${activeSlide}`} className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
            {heroSlides[activeSlide].description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <Link
              to="/register"
              className="bg-[#d2621a] hover:bg-[#b85516] text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-[#d2621a]/50 hover:-translate-y-1 text-lg animate-pulse-glow"
            >
              Register as Student
            </Link>
            <Link
              to="/register"
              className="bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 hover:-translate-y-1 text-lg backdrop-blur-sm"
            >
              Join as Alumni
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-fade-in-up delay-500">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
              >
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-blue-200 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-4" aria-label="Hero slides">
            <button
              type="button"
              onClick={() => goToSlide(activeSlide - 1)}
              className="h-10 w-10 rounded-full border border-white/30 text-white transition hover:bg-white/15"
              aria-label="Previous slide"
            >
              <span aria-hidden="true">&#8592;</span>
            </button>
            <div className="flex items-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === activeSlide ? "w-10 bg-[#f0a35c]" : "w-5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={index === activeSlide}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goToSlide(activeSlide + 1)}
              className="h-10 w-10 rounded-full border border-white/30 text-white transition hover:bg-white/15"
              aria-label="Next slide"
            >
              <span aria-hidden="true">&#8594;</span>
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a6e] to-[#3a2080]">
                Succeed
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              One platform. Endless opportunities.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.15}>
                <div className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-[#1e3a6e]/10 transition-all duration-500 hover:-translate-y-2 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a6e]/10 to-[#3a2080]/10 rounded-2xl flex items-center justify-center text-[#1e3a6e] mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery / Showcase Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Life at <span className="text-[#d2621a]">Alumni Connect</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Moments that define our community.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
            {galleryImages.map((img, i) => (
              <AnimatedSection key={img.src} delay={i * 0.1}>
                <div
                  className={`group relative rounded-2xl overflow-hidden shadow-lg cursor-pointer ${img.span}`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <p className="font-semibold text-sm">{img.alt}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It <span className="text-[#1e3a6e]">Works</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Create Account", desc: "Sign up as a student or alumni in seconds." },
              { step: "02", title: "Build Profile", desc: "Showcase your skills, experience, and goals." },
              { step: "03", title: "Connect & Grow", desc: "Find mentors, jobs, and events tailored to you." },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 0.2}>
                <div className="relative text-center group">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#1e3a6e] to-[#3a2080] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500">{item.desc}</p>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] text-[#1e3a6e]/20">
                      <svg viewBox="0 0 200 50" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M0 25 Q 100 0, 200 25" strokeDasharray="8 4" />
                        <path d="M180 15 L 200 25 L 180 35" />
                      </svg>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a6e] to-[#3a2080]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(210,98,26,0.2),transparent_50%)]" />

        <AnimatedSection className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build Your Future?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Join students and alumni already building their next opportunity. Yours is just a click away.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="bg-[#d2621a] hover:bg-[#b85516] text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-[#d2621a]/50 hover:-translate-y-1 text-lg"
            >
              Create Your Account
            </Link>
            <Link
              to="/login"
              className="bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 hover:-translate-y-1 text-lg backdrop-blur-sm"
            >
              Sign In
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="Alumni Connect Logo" className="h-10 w-auto object-contain" />
            <span className="text-white font-bold text-lg">Alumni Connect</span>
          </div>
          <div className="flex gap-8 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <Link to="/login" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Alumni Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
