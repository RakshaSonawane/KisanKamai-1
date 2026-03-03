import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Equipment } from '../types';
import { MapPin, Tag, ArrowLeft, Loader2, Calendar, User, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const EquipmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'equipment', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEquipment({ id: docSnap.id, ...docSnap.data() } as Equipment);
        } else {
          console.error('No such document!');
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching equipment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-stone-500">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!equipment) return null;

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-stone-500 hover:text-stone-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {t.dashboard.back}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-6">
            <motion.div 
              layoutId="main-image"
              className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-stone-100 bg-white"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={equipment.imageUrls?.[activeImage] || 'https://picsum.photos/seed/tractor/800/600'}
                  alt={equipment.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
            </motion.div>

            {equipment.imageUrls && equipment.imageUrls.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {equipment.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`relative w-24 aspect-square rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImage === index ? 'border-emerald-500 shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider">
                      {equipment.category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider ${
                      equipment.status === 'Available' || !equipment.status ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {equipment.status || 'Available'}
                    </span>
                  </div>
                  <h1 className="text-4xl font-black text-stone-900 leading-tight">{equipment.name}</h1>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-emerald-600">₹{equipment.pricePerAcre}</p>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">{t.dashboard.perAcre}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center text-stone-600">
                  <div className="bg-stone-50 p-3 rounded-2xl mr-4">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t.dashboard.location}</p>
                    <p className="font-bold">{equipment.location}</p>
                  </div>
                </div>
                <div className="flex items-center text-stone-600">
                  <div className="bg-stone-50 p-3 rounded-2xl mr-4">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t.dashboard.owner}</p>
                    <p className="font-bold">{equipment.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center text-stone-600">
                  <div className="bg-stone-50 p-3 rounded-2xl mr-4">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t.equipment.listedOn}</p>
                    <p className="font-bold">{equipment.createdAt?.toDate ? equipment.createdAt.toDate().toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN') : t.dashboard.recently}</p>
                  </div>
                </div>
                <div className="flex items-center text-stone-600">
                  <div className="bg-stone-50 p-3 rounded-2xl mr-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t.dashboard.status}</p>
                    <p className="font-bold">{equipment.status || 'Available'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-stone-50">
                <div className="flex items-center text-stone-900 font-bold">
                  <Info className="h-5 w-5 text-emerald-600 mr-2" />
                  {t.dashboard.description}
                </div>
                <p className="text-stone-600 leading-relaxed">
                  {equipment.description}
                </p>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl shadow-emerald-100 text-white">
              <h3 className="text-xl font-bold mb-2">{t.equipment.interested}</h3>
              <p className="text-emerald-100 mb-6 text-sm">{t.equipment.interestedDesc}</p>
              <button className="w-full bg-white text-emerald-600 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-lg">
                {t.nav.book}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetails;
