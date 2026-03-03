import React from 'react';
import { MapPin, Tag, User } from 'lucide-react';
import { Equipment } from '../types';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface EquipmentCardProps {
  equipment: Equipment;
  onBook?: (id: string) => void;
  showBookButton?: boolean;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, onBook, showBookButton = true }) => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md transition-all"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={equipment.imageUrls?.[0] || 'https://picsum.photos/seed/tractor/400/300'}
          alt={equipment.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-emerald-700 font-bold text-sm shadow-sm">
          ₹{equipment.pricePerAcre || equipment.pricePerDay || 0}{t.dashboard.perAcreShort}
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-stone-900">{equipment.name}</h3>
          <span className="text-xs font-medium bg-stone-100 text-stone-600 px-2 py-1 rounded-md uppercase tracking-wider">
            {equipment.category}
          </span>
        </div>
        
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-stone-500 text-sm">
            <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
            {equipment.location}
          </div>
          <div className="flex items-center text-stone-500 text-sm">
            <User className="h-4 w-4 mr-2 text-emerald-500" />
            {equipment.ownerName}
          </div>
        </div>

        {showBookButton && (
          <button
            onClick={() => onBook?.(equipment.id)}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            {t.nav.book}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default EquipmentCard;
