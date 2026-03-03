import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { EQUIPMENT_CATEGORIES } from '../constants/categories';
import { Image as ImageIcon, X, Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Interface for the equipment form data
 */
interface EquipmentFormData {
  name: string;
  category: string;
  pricePerAcre: number;
  description: string;
  location: string;
}

/**
 * AddEquipment Component
 * Optimized for fast image uploads using client-side compression and parallel processing.
 */
const AddEquipment: React.FC = () => {
  const { user, profile } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  // State management
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageSectionRef = useRef<HTMLDivElement>(null);

  // React Hook Form for validation and form handling
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setError,
    clearErrors
  } = useForm<EquipmentFormData>();

  /**
   * Cleanup object URLs to prevent memory leaks when component unmounts or previews change
   */
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  /**
   * Handles image selection with validation for max 3 images
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    setImageError(null);

    // Rule: Maximum 3 images allowed
    if (selectedImages.length + files.length > 3) {
      setImageError(t.dashboard.maxImages);
      return;
    }

    const newImages = [...selectedImages, ...files];
    setSelectedImages(newImages);

    // Generate previews for the UI
    const newPreviews = files.map(file => URL.createObjectURL(file as Blob));
    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Reset input value to allow re-selecting the same file if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Removes a selected image and its preview
   */
  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    
    if (newImages.length > 0) {
      setImageError(null);
    }
  };

  /**
   * Main submission handler with optimization logic
   */
  const onSubmit = async (data: EquipmentFormData) => {
    if (!user || !profile) return;
    
    // Validation: Minimum 1 image required
    if (selectedImages.length === 0) {
      setImageError(t.dashboard.minImages);
      imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setImageError(null);
    setUploadProgress(t.dashboard.compressing);

    try {
      /**
       * OPTIMIZATION: 
       * 1. Client-side compression using browser-image-compression
       * 2. Parallel processing using Promise.all
       */
      const uploadPromises = selectedImages.map(async (file, index) => {
        // Compression settings as per requirements
        const compressionOptions = {
          maxSizeMB: 0.5, // Max 500KB
          maxWidthOrHeight: 1024, // Max 1024px
          useWebWorker: true, // Better performance
          initialQuality: 0.8,
        };

        try {
          // Step 1: Compress
          const compressedFile = await imageCompression(file, compressionOptions);
          
          // Step 1.5: Verify Storage Configuration
          if (!storage.app.options.storageBucket) {
            throw new Error('Firebase Storage bucket is not configured. Please check your Firebase settings.');
          }

          // Step 2: Prepare Storage Reference
          const timestamp = Date.now();
          const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
          const fileName = `${timestamp}_${index}_${sanitizedName}`;
          const storageRef = ref(storage, `equipment/${user.uid}/${fileName}`);
          
          // Step 3: Upload to Firebase Storage with retry handling
          try {
            const snapshot = await uploadBytes(storageRef, compressedFile);
            // Step 4: Get Download URL
            return getDownloadURL(snapshot.ref);
          } catch (uploadErr: any) {
            console.error('Upload error:', uploadErr);
            if (uploadErr.code === 'storage/retry-limit-exceeded') {
              throw new Error('Upload timed out. Please check your internet connection and try again.');
            }
            if (uploadErr.code === 'storage/unauthorized') {
              throw new Error('You do not have permission to upload files. Please check your Firebase Storage rules.');
            }
            throw new Error(`Upload failed for image ${index + 1}: ${uploadErr.message}`);
          }
        } catch (error: any) {
          console.error(`Error processing image ${index}:`, error);
          throw error;
        }
      });
      
      // Execute all uploads in parallel
      setUploadProgress(t.dashboard.uploading);
      const imageUrls = await Promise.all(uploadPromises);

      // Step 5: Store equipment metadata in Firestore
      setUploadProgress(t.dashboard.finalizing);
      await addDoc(collection(db, 'equipment'), {
        ownerId: user.uid,
        ownerName: profile.displayName,
        name: data.name,
        category: data.category,
        pricePerAcre: Number(data.pricePerAcre),
        description: data.description,
        location: data.location,
        imageUrls, // Store only the download URLs
        status: 'Available',
        createdAt: serverTimestamp(),
      });

      // Step 6: Success state and cleanup
      setSuccess(true);
      setUploadProgress('');
      
      // Reset form and state
      setTimeout(() => {
        reset();
        setSelectedImages([]);
        setPreviews([]);
        setSuccess(false);
        navigate('/owner/my-equipment');
      }, 2500);

    } catch (err: any) {
      console.error('Submission error:', err);
      setImageError(err.message || 'An unexpected error occurred. Please check your network and try again.');
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * UX: Automatically scroll to the first validation error
   */
  useEffect(() => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const element = document.getElementsByName(firstErrorKey)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [errors]);

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-stone-500 hover:text-stone-900 mb-8 transition-colors group"
          disabled={loading}
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          {t.dashboard.backToDashboard}
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
          <div className="bg-emerald-600 px-8 py-8">
            <h1 className="text-3xl font-bold text-white">{t.equipment.addTitle}</h1>
            <p className="text-emerald-100 mt-2 text-lg">{t.equipment.addDesc}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            {/* Error Alert */}
            <AnimatePresence>
              {imageError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">{t.equipment.uploadError}</p>
                      <p className="text-sm">{imageError}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-widest">
                  {t.dashboard.equipmentName} <span className="text-red-500">*</span>
                </label>
                <input 
                  {...register('name', { required: t.dashboard.nameRequired })}
                  className={`w-full px-5 py-4 rounded-2xl border ${errors.name ? 'border-red-500 ring-1 ring-red-100' : 'border-stone-200'} outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-stone-50/50 focus:bg-white`}
                  placeholder="e.g. John Deere 5050 D"
                  disabled={loading}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold ml-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-widest">
                  {t.dashboard.category} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select 
                    {...register('category', { required: t.dashboard.categoryRequired })}
                    className={`w-full px-5 py-4 rounded-2xl border ${errors.category ? 'border-red-500 ring-1 ring-red-100' : 'border-stone-200'} outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none bg-stone-50/50 focus:bg-white`}
                    disabled={loading}
                  >
                    <option value="">{t.equipment.selectCategory}</option>
                    {EQUIPMENT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.en}>
                        {language === 'mr' ? cat.mr : cat.en}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                {errors.category && <p className="text-red-500 text-xs mt-1 font-semibold ml-1">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-widest">
                  {t.dashboard.rentPrice} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₹</span>
                  <input 
                    {...register('pricePerAcre', { 
                      required: t.dashboard.priceRequired,
                      pattern: { value: /^[0-9]+$/, message: t.dashboard.invalidNumber }
                    })}
                    type="text"
                    className={`w-full pl-10 pr-5 py-4 rounded-2xl border ${errors.pricePerAcre ? 'border-red-500 ring-1 ring-red-100' : 'border-stone-200'} outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-stone-50/50 focus:bg-white`}
                    placeholder="800"
                    disabled={loading}
                  />
                </div>
                {errors.pricePerAcre && <p className="text-red-500 text-xs mt-1 font-semibold ml-1">{errors.pricePerAcre.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-widest">
                  {t.dashboard.location} <span className="text-red-500">*</span>
                </label>
                <input 
                  {...register('location', { required: t.dashboard.locationRequired })}
                  className={`w-full px-5 py-4 rounded-2xl border ${errors.location ? 'border-red-500 ring-1 ring-red-100' : 'border-stone-200'} outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-stone-50/50 focus:bg-white`}
                  placeholder="e.g. Karad, Satara"
                  disabled={loading}
                />
                {errors.location && <p className="text-red-500 text-xs mt-1 font-semibold ml-1">{errors.location.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-stone-700 uppercase tracking-widest">
                {t.dashboard.description} <span className="text-red-500">*</span>
              </label>
              <textarea 
                {...register('description', { required: t.dashboard.descRequired })}
                rows={4}
                className={`w-full px-5 py-4 rounded-2xl border ${errors.description ? 'border-red-500 ring-1 ring-red-100' : 'border-stone-200'} outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-stone-50/50 focus:bg-white resize-none`}
                placeholder="Describe the condition, age, and any specific terms of use..."
                disabled={loading}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1 font-semibold ml-1">{errors.description.message}</p>}
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4" ref={imageSectionRef}>
              <div className="flex justify-between items-end">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-widest">
                  {t.dashboard.equipmentPhotos} <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-tighter">
                  {selectedImages.length} / 3 Selected
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {previews.map((preview, index) => (
                    <motion.div 
                      key={preview}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-stone-200 shadow-sm group"
                    >
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      {!loading && (
                        <button 
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 active:scale-95"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {previews.length < 3 && !loading && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 transition-all group">
                    <div className="bg-stone-100 p-3 rounded-full mb-2 group-hover:bg-emerald-100 transition-colors">
                      <ImageIcon className="h-6 w-6 text-stone-400 group-hover:text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest group-hover:text-emerald-700">{t.equipment.addPhoto}</span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              
              <p className="text-[10px] text-stone-400 font-medium italic">
                {t.dashboard.photoTip}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center justify-center relative overflow-hidden ${
                success 
                  ? 'bg-emerald-100 text-emerald-700 shadow-none' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-emerald-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-3" />
                    <span>{t.equipment.processing}</span>
                  </div>
                  {uploadProgress && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-normal mt-1 opacity-80"
                    >
                      {uploadProgress}
                    </motion.span>
                  )}
                </div>
              ) : success ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center"
                >
                  <CheckCircle2 className="h-7 w-7 mr-2" />
                  {t.dashboard.successListed}
                </motion.div>
              ) : (
                t.dashboard.addEquipment
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEquipment;

