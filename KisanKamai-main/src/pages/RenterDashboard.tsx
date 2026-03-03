import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Equipment, Booking, BookingStatus } from '../types';
import EquipmentCard from '../components/EquipmentCard';
import { Search, Filter, Calendar, X, Loader2, CheckCircle2, MapPin, Info, ArrowRight, Clock, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

const RenterDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  const [bookingData, setBookingData] = useState({ 
    date: format(new Date(), 'yyyy-MM-dd'), 
    time: '08:00',
    area: '1.0'
  });
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const eqSnap = await getDocs(collection(db, 'equipment'));
      setEquipments(eqSnap.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id,
          name: data.name || '',
          category: data.category || '',
          location: data.location || ''
        } as unknown as Equipment;
      }));

      if (user) {
        const bkQuery = query(collection(db, 'orders'), where('renterId', '==', user.uid));
        const bkSnap = await getDocs(bkQuery);
        setMyBookings(bkSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as Booking)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filteredEquipment = equipments.filter(eq => {
    const name = eq.name || '';
    const location = eq.location || '';
    const category = eq.category || '';

    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBook = async () => {
    if (!user || !profile || !selectedEquipment) return;
    setBookingLoading(true);
    try {
      const area = parseFloat(bookingData.area);
      const totalPrice = area * selectedEquipment.pricePerAcre;

      await addDoc(collection(db, 'orders'), {
        equipmentId: selectedEquipment.id,
        equipmentName: selectedEquipment.name,
        ownerId: selectedEquipment.ownerId,
        renterId: user.uid,
        renterName: profile.displayName,
        startDate: bookingData.date,
        time: bookingData.time,
        area: area,
        totalPrice,
        status: BookingStatus.PENDING,
        createdAt: serverTimestamp()
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setShowRequestModal(false);
        setSelectedEquipment(null);
        fetchData();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  const totalPrice = selectedEquipment ? parseFloat(bookingData.area) * selectedEquipment.pricePerAcre : 0;

  if (loading) return <div className="p-8 text-center">{t.common.loading}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">{t.dashboard.renterTitle}</h1>
        <p className="text-stone-500">{t.dashboard.renterDesc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
            <div className="flex items-center mb-6">
              <Filter className="h-5 w-5 text-emerald-600 mr-2" />
              <h2 className="font-bold text-stone-900">{t.dashboard.filters}</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.dashboard.search}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.dashboard.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.dashboard.category}</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="All">{t.dashboard.allCategories}</option>
                  <option value="Tractor">Tractor</option>
                  <option value="Harvester">Harvester</option>
                  <option value="Plough">Plough</option>
                  <option value="Seeder">Seeder</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-900">{t.dashboard.availableEquipment}</h2>
              <span className="text-sm text-stone-500">{filteredEquipment.length} {t.dashboard.itemsFound}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEquipment.length === 0 ? (
                <div className="col-span-full p-12 bg-white rounded-3xl border-2 border-dashed border-stone-200 text-center">
                  <p className="text-stone-400">{t.dashboard.noResults}</p>
                </div>
              ) : (
                filteredEquipment.map(eq => (
                  <div key={eq.id} onClick={() => { setSelectedEquipment(eq); setShowDetails(true); }}>
                    <EquipmentCard 
                      equipment={eq} 
                      showBookButton={false}
                    />
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-emerald-600 mr-2" />
              <h2 className="text-xl font-bold text-stone-900">{t.dashboard.myBookings}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myBookings.length === 0 ? (
                <div className="col-span-full p-8 bg-white rounded-3xl border border-stone-100 text-center">
                  <p className="text-stone-400">{t.dashboard.noMyBookings}</p>
                </div>
              ) : (
                myBookings.map(bk => (
                  <div key={bk.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-stone-900">{bk.equipmentName}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        bk.status === BookingStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                        bk.status === BookingStatus.REJECTED ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {bk.status}
                      </span>
                    </div>
                    <div className="text-sm text-stone-600">
                      <p>{t.dashboard.date}: {bk.startDate} {bk.time && `${t.dashboard.at} ${bk.time}`}</p>
                      <p>{t.dashboard.area}: {bk.area} {t.dashboard.acres}</p>
                      <p className="font-bold text-stone-900 mt-1">{t.dashboard.totalAmount}: ₹{bk.totalPrice}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && selectedEquipment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="relative h-64 w-full group">
                <div className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                  {(selectedEquipment.imageUrls && selectedEquipment.imageUrls.length > 0) ? (
                    selectedEquipment.imageUrls.map((url, idx) => (
                      <img 
                        key={idx} 
                        src={url} 
                        className="w-full h-full object-cover flex-shrink-0 snap-center" 
                        referrerPolicy="no-referrer" 
                      />
                    ))
                  ) : (
                    <img src="https://picsum.photos/seed/tractor/800/600" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  )}
                </div>
                <button onClick={() => setShowDetails(false)} className="absolute top-6 right-6 p-2 bg-stone-900/40 backdrop-blur-md rounded-full text-white hover:bg-stone-900/60 transition-all z-10">
                  <X className="h-6 w-6" />
                </button>
                {selectedEquipment.imageUrls && selectedEquipment.imageUrls.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {selectedEquipment.imageUrls.map((_, idx) => (
                      <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
                    ))}
                  </div>
                )}
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-stone-900 mb-1">{selectedEquipment.name}</h2>
                    <div className="flex items-center text-stone-500 text-sm">
                      <MapPin className="h-4 w-4 mr-1 text-emerald-600" />
                      {selectedEquipment.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">₹{selectedEquipment.pricePerAcre}</div>
                    <div className="text-xs text-stone-400 font-bold uppercase tracking-wider">{t.dashboard.perAcre}</div>
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <div>
                    <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-2 text-emerald-600" />
                      {t.dashboard.description}
                    </h3>
                    <p className="text-stone-600 leading-relaxed">{selectedEquipment.description || t.dashboard.noDesc}</p>
                  </div>
                </div>

                <button
                  onClick={() => { setShowDetails(false); setShowRequestModal(true); }}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center"
                >
                  {t.dashboard.requestEquipment}
                  <ArrowRight className="ml-2 h-6 w-6" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && selectedEquipment && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !bookingLoading && setShowRequestModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              {bookingSuccess ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-2">{t.dashboard.requestSent}</h2>
                  <p className="text-stone-500">{t.dashboard.requestSentDesc}</p>
                </div>
              ) : (
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-stone-900">{t.dashboard.requestEquipment}</h2>
                    <button onClick={() => setShowRequestModal(false)} className="text-stone-400 hover:text-stone-600">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-2 flex items-center">
                        <Maximize className="h-3 w-3 mr-1" />
                        {t.dashboard.fieldArea}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={bookingData.area}
                        onChange={(e) => setBookingData({ ...bookingData, area: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border border-stone-200 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-stone-50 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {t.dashboard.selectDate}
                        </label>
                        <input
                          type="date"
                          value={bookingData.date}
                          onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {t.dashboard.selectTime}
                        </label>
                        <input
                          type="time"
                          value={bookingData.time}
                          onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                      <div className="flex justify-between items-center text-emerald-900">
                        <span className="font-medium">{t.dashboard.totalAmount}</span>
                        <span className="text-2xl font-bold">₹{totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold uppercase mt-2 tracking-wider">
                        ₹{selectedEquipment.pricePerAcre} x {bookingData.area} acres
                      </div>
                    </div>

                    <button
                      disabled={bookingLoading}
                      onClick={handleBook}
                      className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center"
                    >
                      {bookingLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : t.dashboard.confirmRequest}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RenterDashboard;
