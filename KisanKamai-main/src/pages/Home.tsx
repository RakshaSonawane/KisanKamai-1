import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, ShieldCheck, Clock, Users, ArrowRight, Tractor, Sprout, Settings } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Footer from '../components/Footer';


const Home: React.FC = () => {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative bg-emerald-900 py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000&auto=format&fit=crop" 
            alt="Farm background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/60 to-emerald-900/90"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 md:mb-6 tracking-tight leading-[1.1]"
            >
              {t.hero.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-2xl text-emerald-50 mb-8 md:mb-12 font-medium max-w-2xl mx-auto"
            >
              {t.hero.subtitle}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link
                to="/register?role=owner"
                className="bg-white text-emerald-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-lg flex items-center justify-center"
              >
                {t.hero.ctaList}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/register?role=renter"
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg border border-emerald-500/30 flex items-center justify-center"
              >
                {t.hero.ctaRent}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">{t.howItWorks.title}</h2>
            <div className="h-1.5 w-20 bg-emerald-600 mx-auto rounded-full"></div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            <motion.div variants={itemVariants} className="text-center group">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Search className="h-10 w-10 text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">{t.howItWorks.step1.title}</h3>
              <p className="text-stone-600 leading-relaxed">{t.howItWorks.step1.desc}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center group">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="h-10 w-10 text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">{t.howItWorks.step2.title}</h3>
              <p className="text-stone-600 leading-relaxed">{t.howItWorks.step2.desc}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center group">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Clock className="h-10 w-10 text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">{t.howItWorks.step3.title}</h3>
              <p className="text-stone-600 leading-relaxed">{t.howItWorks.step3.desc}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-stone-50 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">500+</div>
              <div className="text-stone-500 font-medium">{t.home.stats.listed}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">1200+</div>
              <div className="text-stone-500 font-medium">{t.home.stats.farmers}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">₹10L+</div>
              <div className="text-stone-500 font-medium">{t.home.stats.saved}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
              <div className="text-stone-500 font-medium">{t.home.stats.villages}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">{t.home.testimonials}</h2>
            <div className="h-1.5 w-20 bg-emerald-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Suresh Patil",
                village: "Sangli",
                text: "I rented a tractor for my harvest at half the market price. KrishiSeva is a blessing for small farmers.",
                img: "https://picsum.photos/seed/farmer1/100/100"
              },
              {
                name: "Ramesh Deshmukh",
                village: "Satara",
                text: "Listing my unused harvester helped me earn extra income. The platform is very easy to use in Marathi.",
                img: "https://picsum.photos/seed/farmer2/100/100"
              },
              {
                name: "Anil Kulkarni",
                village: "Kolhapur",
                text: "The trust and transparency here are amazing. I can see who I am renting from and their location.",
                img: "https://picsum.photos/seed/farmer3/100/100"
              }
            ].map((t, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-stone-50 p-8 rounded-3xl border border-stone-100 shadow-sm"
              >
                <div className="flex items-center mb-6">
                  <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full mr-4" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold text-stone-900">{t.name}</h4>
                    <p className="text-emerald-600 text-sm font-medium">{t.village}</p>
                  </div>
                </div>
                <p className="text-stone-600 italic leading-relaxed">"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
