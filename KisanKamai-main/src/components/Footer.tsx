import React from 'react';
import { Tractor, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-stone-900 text-stone-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="bg-white p-1 rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/gokisaan.firebasestorage.app/o/1000106839.png?alt=media&token=284e273b-0f64-4dbe-8079-11effaf70bf5" 
                  alt="KisaanKamai Logo" 
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://img.icons8.com/color/96/tractor.png";
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="ml-3 text-2xl font-black text-white tracking-tight">
                Kisaan<span className="text-emerald-400">Kamai</span>
              </span>
            </div>
            <p className="text-stone-400 max-w-md">
              {t.footer.desc}
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-emerald-500 transition-colors">{t.footer.aboutUs}</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">{t.footer.howItWorks}</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">{t.footer.privacyPolicy}</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">{t.footer.termsOfService}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.contactUs}</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-emerald-500" />
                <span>support@krishiseva.in</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-emerald-500" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <span>Pune, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-stone-800 mt-12 pt-8 text-center text-sm text-stone-500">
          <p>© {new Date().getFullYear()} KisaanKamai. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
