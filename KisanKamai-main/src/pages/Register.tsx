import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { Tractor, Loader2, User, Building2, Globe, Mail, Phone, MapPin, Home as HomeIcon, Maximize, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { UserRole } from '../types';

const Register: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') as UserRole || UserRole.RENTER;
  
  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm({
    mode: 'onChange',
    defaultValues: {
      role: initialRole,
      displayName: '',
      email: '',
      password: '',
      address: '',
      village: '',
      fieldArea: '',
      phoneNumber: '',
      otp: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  const navigate = useNavigate();
  const selectedRole = watch('role');
  const phoneNumber = watch('phoneNumber');
  const otpCode = watch('otp');
  
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!recaptchaVerifier.current && recaptchaRef.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'invisible',
        callback: () => {}
      });
    }
  }, []);

  // Scroll to first error
  useEffect(() => {
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      let element = document.getElementsByName(firstError)[0];
      
      // If it's a radio button (sr-only), scroll to its parent container
      if (element && (element as HTMLInputElement).type === 'radio') {
        element = element.closest('.grid') || element.parentElement || element;
      }

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight
        element.classList.add('ring-4', 'ring-red-500/20', 'border-red-500');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-red-500/20');
        }, 3000);
      }
    }
  }, [errors]);

  const sendOtp = async () => {
    const isValid = await trigger('phoneNumber');
    if (!isValid) return;
    
    setSendingOtp(true);
    setError('');
    try {
      const formattedPhone = `+91${phoneNumber}`;
      const appVerifier = recaptchaVerifier.current;
      if (!appVerifier) throw new Error('Recaptcha not initialized');
      
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    
    setVerifyingOtp(true);
    setError('');
    try {
      if (!confirmationResult) throw new Error('No confirmation result');
      await confirmationResult.confirm(otpCode);
      setPhoneVerified(true);
      setOtpSent(false);
    } catch (err: any) {
      setError('Invalid OTP. Please check and try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: selectedRole,
          createdAt: new Date().toISOString()
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In. Please add it in Firebase Console.');
      } else {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!phoneVerified) {
      setError('Please verify your phone number first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.displayName });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        address: data.address,
        village: data.village,
        fieldArea: parseFloat(data.fieldArea),
        phoneNumber: data.phoneNumber,
        createdAt: new Date().toISOString()
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'mr' : 'en');
  };

  const Label = ({ children, name, required = true }: { children: React.ReactNode, name: string, required?: boolean }) => (
    <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">
      <span className="flex items-center">
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {errors[name as keyof typeof errors] && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[10px] text-red-500 lowercase font-medium block mt-1"
        >
          {errors[name as keyof typeof errors]?.message as string || t.auth.mandatoryField}
        </motion.span>
      )}
    </label>
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000&auto=format&fit=crop" 
          alt="Agriculture background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-emerald-900/60 backdrop-blur-[2px]"></div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center text-white">
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-white/20 flex items-center justify-center overflow-hidden">
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/gokisaan.firebasestorage.app/o/1000106839.png?alt=media&token=284e273b-0f64-4dbe-8079-11effaf70bf5" 
                alt="KisaanKamai Logo" 
                className="h-10 w-10 md:h-14 md:w-14 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://img.icons8.com/color/96/tractor.png";
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="ml-4 text-2xl md:text-3xl font-black text-white tracking-tight">
              Kisaan<span className="text-emerald-400">Kamai</span>
            </span>
          </div>
        </div>
        
        <div className="pointer-events-auto">
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all font-medium"
          >
            <Globe className="h-5 w-5" />
            <span>{language === 'en' ? 'मराठी' : 'English'}</span>
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl px-4 py-24 md:py-32"
      >
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-100">
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-stone-900 mb-2">{t.auth.registerTitle}</h2>
              <p className="text-stone-500">Join the community of smart farmers</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center"
              >
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-4 uppercase tracking-wider">
                  {t.auth.role} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`
                    relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${selectedRole === UserRole.OWNER ? 'border-emerald-600 bg-emerald-50' : 'border-stone-100 bg-stone-50 hover:bg-stone-100'}
                  `}>
                    <input {...register('role')} type="radio" value={UserRole.OWNER} className="sr-only" />
                    <div className={`p-2 rounded-xl mr-4 ${selectedRole === UserRole.OWNER ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className={`font-bold ${selectedRole === UserRole.OWNER ? 'text-emerald-900' : 'text-stone-500'}`}>
                      {t.auth.owner}
                    </span>
                  </label>
                  <label className={`
                    relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${selectedRole === UserRole.RENTER ? 'border-emerald-600 bg-emerald-50' : 'border-stone-100 bg-stone-50 hover:bg-stone-100'}
                  `}>
                    <input {...register('role')} type="radio" value={UserRole.RENTER} className="sr-only" />
                    <div className={`p-2 rounded-xl mr-4 ${selectedRole === UserRole.RENTER ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <span className={`font-bold ${selectedRole === UserRole.RENTER ? 'text-emerald-900' : 'text-stone-500'}`}>
                      {t.auth.renter}
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label name="displayName">
                    <User className="h-4 w-4 mr-2 text-emerald-600" />
                    {t.auth.fullName}
                  </Label>
                  <input
                    {...register('displayName', { required: t.auth.mandatoryField })}
                    type="text"
                    className={`w-full px-5 py-4 rounded-2xl border focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50 ${errors.displayName ? 'border-red-500 animate-pulse' : 'border-stone-200'}`}
                    placeholder="e.g. Rajesh Patil"
                  />
                </div>

                <div className="space-y-2">
                  <Label name="email">
                    <Mail className="h-4 w-4 mr-2 text-emerald-600" />
                    {t.auth.email}
                  </Label>
                  <input
                    {...register('email', { 
                      required: t.auth.mandatoryField, 
                      pattern: { value: /^\S+@\S+$/i, message: t.auth.invalidEmail } 
                    })}
                    type="email"
                    className={`w-full px-5 py-4 rounded-2xl border focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50 ${errors.email ? 'border-red-500 animate-pulse' : 'border-stone-200'}`}
                    placeholder="farmer@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label name="address">
                  <HomeIcon className="h-4 w-4 mr-2 text-emerald-600" />
                  {t.auth.address}
                </Label>
                <textarea
                  {...register('address', { required: t.auth.mandatoryField })}
                  rows={2}
                  className={`w-full px-5 py-4 rounded-2xl border focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50 resize-none ${errors.address ? 'border-red-500 animate-pulse' : 'border-stone-200'}`}
                  placeholder="Street name, Landmark..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label name="village">
                    <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
                    {t.auth.village}
                  </Label>
                  <input
                    {...register('village', { required: t.auth.mandatoryField })}
                    type="text"
                    className={`w-full px-5 py-4 rounded-2xl border focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50 ${errors.village ? 'border-red-500 animate-pulse' : 'border-stone-200'}`}
                    placeholder="e.g. Sangli"
                  />
                </div>

                <div className="space-y-2">
                  <Label name="fieldArea">
                    <Maximize className="h-4 w-4 mr-2 text-emerald-600" />
                    {t.auth.fieldArea}
                  </Label>
                  <input
                    {...register('fieldArea', { required: t.auth.mandatoryField, min: 0 })}
                    type="number"
                    step="0.1"
                    className={`w-full px-5 py-4 rounded-2xl border focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50 ${errors.fieldArea ? 'border-red-500 animate-pulse' : 'border-stone-200'}`}
                    placeholder="e.g. 2.5"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label name="phoneNumber">
                  <Phone className="h-4 w-4 mr-2 text-emerald-600" />
                  {t.auth.phoneNumber}
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">+91</span>
                    <input
                      {...register('phoneNumber', { 
                        required: t.auth.mandatoryField, 
                        pattern: { value: /^[0-9]{10}$/, message: t.auth.invalidPhone } 
                      })}
                      type="tel"
                      disabled={phoneVerified}
                      className={`w-full pl-14 pr-5 py-4 rounded-2xl border focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50 disabled:opacity-50 ${errors.phoneNumber ? 'border-red-500 animate-pulse' : 'border-stone-200'}`}
                      placeholder="9876543210"
                    />
                  </div>
                  {!phoneVerified && !otpSent && (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={sendingOtp || !phoneNumber || phoneNumber.length < 10}
                      className="bg-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl font-bold hover:bg-emerald-200 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {sendingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : t.auth.sendOtp}
                    </button>
                  )}
                  {phoneVerified && (
                    <div className="bg-emerald-50 text-emerald-600 px-6 py-4 rounded-2xl font-bold flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Verified
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {otpSent && !phoneVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-3"
                    >
                      <input
                        {...register('otp')}
                        type="text"
                        className="flex-1 px-5 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50"
                        placeholder={t.auth.otpCode}
                      />
                      <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={verifyingOtp || !otpCode || otpCode.length < 6}
                        className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {verifyingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : t.auth.verifyOtp}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label name="password">
                  <Lock className="h-4 w-4 mr-2 text-emerald-600" />
                  {t.auth.password}
                </Label>
                <input
                  {...register('password', { required: t.auth.mandatoryField, minLength: 6 })}
                  type="password"
                  className={`w-full px-5 py-4 rounded-2xl border focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-stone-50 ${errors.password ? 'border-red-500 animate-pulse' : 'border-stone-200'}`}
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4 space-y-4">
                <button
                  disabled={loading || !phoneVerified}
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-bold text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t.auth.submitRegister}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-stone-400 font-medium">OR</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white border-2 border-stone-100 text-stone-700 py-4 rounded-[1.5rem] font-bold flex items-center justify-center hover:bg-stone-50 transition-all shadow-sm"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5 mr-3" alt="Google" />
                  {t.auth.googleSignIn}
                </button>
              </div>
            </form>

            <div className="mt-10 text-center">
              <p className="text-stone-500 font-medium">
                {t.auth.hasAccount}{' '}
                <Link to="/login" className="text-emerald-600 font-bold hover:underline ml-1">
                  {t.auth.submitLogin}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div ref={recaptchaRef}></div>
      <div className="h-12 relative z-10"></div>
    </div>
  );
};

export default Register;
