import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile, Equipment, UserRole } from '../types';
import { Users, Package, ShieldAlert, Trash2, Search } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'equipment' | 'disputes'>('users');

  const fetchData = async () => {
    setLoading(true);
    try {
      const uSnap = await getDocs(collection(db, 'users'));
      setUsers(uSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as unknown as UserProfile)));

      const eSnap = await getDocs(collection(db, 'equipment'));
      setEquipments(eSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as Equipment)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteEquipment = async (id: string) => {
    if (window.confirm(t.dashboard.confirmDelete)) {
      try {
        await deleteDoc(doc(db, 'equipment', id));
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-8 text-center">{t.common.loading}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">{t.dashboard.adminControl}</h1>
        <p className="text-stone-500">{t.dashboard.adminDesc}</p>
      </div>

      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 rounded-2xl font-bold flex items-center whitespace-nowrap transition-all ${
            activeTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Users className="h-5 w-5 mr-2" />
          {t.dashboard.users} ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-6 py-3 rounded-2xl font-bold flex items-center whitespace-nowrap transition-all ${
            activeTab === 'equipment' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Package className="h-5 w-5 mr-2" />
          {t.dashboard.equipment} ({equipments.length})
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-6 py-3 rounded-2xl font-bold flex items-center whitespace-nowrap transition-all ${
            activeTab === 'disputes' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          <ShieldAlert className="h-5 w-5 mr-2" />
          {t.dashboard.disputes} (0)
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.dashboard.name}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.dashboard.email}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.dashboard.role}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.dashboard.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900">{u.displayName}</td>
                    <td className="px-6 py-4 text-stone-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                        u.role === UserRole.OWNER ? 'bg-blue-100 text-blue-700' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-stone-400 hover:text-stone-600">
                        <Search className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.dashboard.equipment}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.dashboard.owner}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.dashboard.price}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.dashboard.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {equipments.map(e => (
                  <tr key={e.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={e.imageUrls?.[0] || 'https://picsum.photos/seed/tractor/100/100'} className="w-10 h-10 rounded-lg object-cover mr-3" referrerPolicy="no-referrer" />
                        <div>
                          <div className="font-medium text-stone-900">{e.name}</div>
                          <div className="text-xs text-stone-500">{e.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{e.ownerName}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">₹{e.pricePerAcre}{t.dashboard.perAcreShort}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDeleteEquipment(e.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="p-12 text-center">
            <ShieldAlert className="h-12 w-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400">{t.dashboard.noDisputes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
