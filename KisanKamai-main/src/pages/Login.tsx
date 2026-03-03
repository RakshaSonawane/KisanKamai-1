import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { Tractor, Loader2, Mail, Lock, AlertCircle, CheckCircle2, Building2, User } from 'lucide-react';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      role: UserRole.RENTER
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  
  const emailValue = watch('email');
  const selectedRole = watch('role');

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Fetch profile from Firestore
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data();
        
        // Update role in Firestore if it's different from selected
        if (profile.role !== data.role && data.role !== UserRole.ADMIN) {
          await updateDoc(docRef, { role: data.role });
        }

        if (data.role === UserRole.OWNER) {
          setTimeout(() => navigate('/owner-dashboard'), 500);
        } else if (data.role === UserRole.RENTER) {
          setTimeout(() => navigate('/renter-dashboard'), 500);
        } else {
          navigate('/');
        }
      } else {
        // Fallback if no profile exists yet (e.g. Google sign-in first time)
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailValue) {
      setError('Please enter your email address first.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendPasswordResetEmail(auth, emailValue);
      setSuccess(t.auth.resetEmailSent);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-stone-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-stone-100 p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="bg-white p-2 rounded-3xl shadow-2xl transform -rotate-6 border border-stone-100 flex items-center justify-center overflow-hidden">
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/gokisaan.firebasestorage.app/o/1000106839.png?alt=media&token=284e273b-0f64-4dbe-8079-11effaf70bf5" 
                alt="KisaanKamai Logo" 
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://img.icons8.com/color/96/tractor.png";
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="ml-4 text-3xl font-black text-emerald-900 tracking-tight">
              Kisaan<span className="text-emerald-600">Kamai</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900">{t.auth.loginTitle}</h2>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center"
            >
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-sm font-medium flex items-center"
            >
              <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-4 uppercase tracking-wider">
              {t.auth.role} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`
                relative flex flex-col items-center p-4 rounded-2xl border-2 cursor-pointer transition-all
                ${selectedRole === UserRole.OWNER ? 'border-emerald-600 bg-emerald-50' : 'border-stone-100 bg-stone-50 hover:bg-stone-100'}
              `}>
                <input {...register('role')} type="radio" value={UserRole.OWNER} className="sr-only" />
                <Building2 className={`h-6 w-6 mb-2 ${selectedRole === UserRole.OWNER ? 'text-emerald-600' : 'text-stone-400'}`} />
                <span className={`text-[10px] font-bold text-center ${selectedRole === UserRole.OWNER ? 'text-emerald-900' : 'text-stone-500'}`}>
                  {t.auth.owner}
                </span>
              </label>
              <label className={`
                relative flex flex-col items-center p-4 rounded-2xl border-2 cursor-pointer transition-all
                ${selectedRole === UserRole.RENTER ? 'border-emerald-600 bg-emerald-50' : 'border-stone-100 bg-stone-50 hover:bg-stone-100'}
              `}>
                <input {...register('role')} type="radio" value={UserRole.RENTER} className="sr-only" />
                <User className={`h-6 w-6 mb-2 ${selectedRole === UserRole.RENTER ? 'text-emerald-600' : 'text-stone-400'}`} />
                <span className={`text-[10px] font-bold text-center ${selectedRole === UserRole.RENTER ? 'text-emerald-900' : 'text-stone-500'}`}>
                  {t.auth.renter}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-bold text-stone-700 uppercase tracking-wider">
              <Mail className="h-4 w-4 mr-2 text-emerald-600" />
              {t.auth.email}
            </label>
            <input
              {...register('email', { required: true })}
              type="email"
              className="w-full px-5 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50"
              placeholder="farmer@example.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="flex items-center text-sm font-bold text-stone-700 uppercase tracking-wider">
                <Lock className="h-4 w-4 mr-2 text-emerald-600" />
                {t.auth.password}
              </label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                {t.auth.forgotPassword}
              </button>
            </div>
            <input
              {...register('password', { required: true })}
              type="password"
              className="w-full px-5 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t.auth.submitLogin}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-stone-500 font-medium">
            {t.auth.noAccount}{' '}
            <Link to="/register" className="text-emerald-600 font-bold hover:underline">
              {t.auth.registerTitle}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
