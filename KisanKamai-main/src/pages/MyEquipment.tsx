import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Equipment } from '../types';
import { Plus, Package, MapPin, Tag, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const MyEquipment: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyEquipment = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'equipment'),
          where('ownerId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Equipment));
        
        // Sort in memory to avoid needing a composite index
        fetched.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        
        setEquipments(fetched);
      } catch (err) {
        console.error('Error fetching equipment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEquipment();
  }, [user]);

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

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">{t.dashboard.myEquipment}</h1>
            <p className="text-stone-500 mt-1">{t.dashboard.manageMachinery}</p>
          </div>
          <button
            onClick={() => navigate('/owner/add-equipment')}
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t.dashboard.addEquipment}
          </button>
        </div>

        {equipments.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-stone-200">
            <div className="bg-stone-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-stone-300" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">{t.dashboard.noEquipment}</h2>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">
              {t.dashboard.noEquipmentDesc}
            </p>
            <button
              onClick={() => navigate('/owner/add-equipment')}
              className="text-emerald-600 font-bold flex items-center justify-center mx-auto hover:underline"
            >
              {t.dashboard.addFirst} <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {equipments.map((eq, index) => (
              <motion.div
                key={eq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/equipment/${eq.id}`)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={eq.imageUrls?.[0] || 'https://picsum.photos/seed/tractor/600/400'}
                    alt={eq.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                      eq.status === 'Available' || !eq.status ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {eq.status || 'Available'}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900 group-hover:text-emerald-600 transition-colors">{eq.name}</h3>
                      <div className="flex items-center text-stone-400 text-xs mt-1 font-medium uppercase tracking-widest">
                        <Tag className="h-3 w-3 mr-1" />
                        {eq.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-600">₹{eq.pricePerAcre}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">{t.dashboard.perAcre}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-stone-500 text-sm mb-6">
                    <MapPin className="h-4 w-4 mr-2 text-stone-300" />
                    {eq.location}
                  </div>

                  <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      {t.dashboard.addedOn} {eq.createdAt?.toDate ? eq.createdAt.toDate().toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN') : t.dashboard.recently}
                    </span>
                    <span className="text-emerald-600 font-bold text-sm flex items-center">
                      {t.dashboard.viewDetails} <ArrowRight className="h-4 w-4 ml-1" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEquipment;
