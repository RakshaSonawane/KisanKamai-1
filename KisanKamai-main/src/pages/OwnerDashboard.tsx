import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Equipment, Booking, BookingStatus } from '../types';
import { Plus, Package, Calendar, Check, X, Loader2, ArrowRight, TrendingUp, Users } from 'lucide-react';
import { motion } from 'motion/react';

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all equipment for stats
      const eqQuery = query(
        collection(db, 'equipment'), 
        where('ownerId', '==', user.uid)
      );
      const eqSnap = await getDocs(eqQuery);
      const eqData = eqSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as Equipment));
      // Sort in memory to avoid needing a composite index
      eqData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setEquipments(eqData);

      // Fetch all bookings for stats
      const bkQuery = query(
        collection(db, 'orders'), 
        where('ownerId', '==', user.uid)
      );
      const bkSnap = await getDocs(bkQuery);
      const bkData = bkSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as Booking));
      // Sort in memory to avoid needing a composite index
      bkData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setBookings(bkData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateDoc(doc(db, 'orders', bookingId), { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-stone-900 tracking-tight">{t.dashboard.ownerTitle}</h1>
          <p className="text-stone-500 mt-1 font-medium">{t.dashboard.manageMachinery}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/owner/my-equipment')}
            className="bg-white text-stone-700 px-6 py-4 rounded-2xl font-bold border border-stone-200 hover:bg-stone-50 transition-all shadow-sm"
          >
            {t.dashboard.myEquipment}
          </button>
          <button
            onClick={() => navigate('/owner/add-equipment')}
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t.dashboard.addEquipment}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{t.dashboard.totalEquipment}</p>
          <p className="text-3xl font-black text-stone-900 mt-1">{equipments.length}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{t.dashboard.activeBookings}</p>
          <p className="text-3xl font-black text-stone-900 mt-1">
            {bookings.filter(b => b.status === BookingStatus.APPROVED).length}
          </p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-amber-600" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{t.dashboard.totalEarnings}</p>
          <p className="text-3xl font-black text-stone-900 mt-1">
            ₹{bookings.filter(b => b.status === BookingStatus.APPROVED).reduce((acc, b) => acc + (b.totalPrice || 0), 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Package className="h-6 w-6 text-emerald-600 mr-2" />
                <h2 className="text-2xl font-bold text-stone-900">{t.dashboard.myEquipment}</h2>
              </div>
              <button 
                onClick={() => navigate('/owner/my-equipment')}
                className="text-emerald-600 font-bold text-sm hover:underline flex items-center"
              >
                {t.dashboard.viewAll} <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {equipments.length === 0 ? (
                <div className="col-span-full p-12 bg-white rounded-3xl border-2 border-dashed border-stone-200 text-center">
                  <p className="text-stone-400">{t.dashboard.noEquipment}</p>
                  <button 
                    onClick={() => navigate('/owner/add-equipment')}
                    className="text-emerald-600 font-bold mt-4 hover:underline"
                  >
                    {t.dashboard.addFirst}
                  </button>
                </div>
              ) : (
                equipments.slice(0, 4).map(eq => (
                  <div 
                    key={eq.id} 
                    onClick={() => navigate(`/equipment/${eq.id}`)}
                    className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 flex gap-5 group cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="relative flex-shrink-0">
                      <img 
                        src={eq.imageUrls?.[0] || 'https://picsum.photos/seed/tractor/400/300'} 
                        className="w-24 h-24 rounded-2xl object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-stone-900 group-hover:text-emerald-600 transition-colors">{eq.name}</h3>
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mt-1">{eq.category}</p>
                      <p className="text-emerald-600 font-black mt-2">₹{eq.pricePerAcre}{t.dashboard.perAcreShort}</p>
                      <div className="mt-2">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {eq.status || 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-emerald-600 mr-2" />
              <h2 className="text-2xl font-bold text-stone-900">{t.dashboard.bookings}</h2>
            </div>

            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="p-8 bg-white rounded-3xl border border-stone-100 text-center">
                  <p className="text-stone-400">{t.dashboard.noBookings}</p>
                </div>
              ) : (
                bookings.slice(0, 5).map(bk => (
                  <div key={bk.id} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-stone-900">{bk.equipmentName}</h4>
                        <div className="flex items-center text-xs text-stone-500 mt-1">
                          <Users className="h-3 w-3 mr-1" />
                          {t.dashboard.by} {bk.renterName}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider ${
                        bk.status === BookingStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                        bk.status === BookingStatus.REJECTED ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {bk.status}
                      </span>
                    </div>
                    <div className="text-sm text-stone-600 mb-6 space-y-1">
                      <p className="flex justify-between"><span>{t.dashboard.date}:</span> <span className="font-bold text-stone-900">{bk.startDate}</span></p>
                      <p className="flex justify-between"><span>{t.dashboard.area}:</span> <span className="font-bold text-stone-900">{bk.area} {t.dashboard.acres}</span></p>
                      <p className="flex justify-between pt-2 border-t border-stone-50">
                        <span>{t.dashboard.totalAmount}:</span> 
                        <span className="font-black text-emerald-600 text-lg">₹{bk.totalPrice}</span>
                      </p>
                    </div>
                    
                    {bk.status === BookingStatus.PENDING && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleBookingStatus(bk.id, BookingStatus.APPROVED)}
                          className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-50 transition-all"
                        >
                          {t.dashboard.approve}
                        </button>
                        <button
                          onClick={() => handleBookingStatus(bk.id, BookingStatus.REJECTED)}
                          className="flex-1 bg-stone-100 text-stone-600 py-3 rounded-xl text-sm font-bold hover:bg-stone-200 transition-all"
                        >
                          {t.dashboard.reject}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
