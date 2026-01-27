import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, Loader2, Utensils, Image as ImageIcon } from 'lucide-react';
import { analyzeFoodImage } from '../services/geminiService';
import { FoodItem, MealLog } from '../types';

interface MealLoggerProps {
  onLogMeal: (log: MealLog) => void;
  onClose: () => void;
}

// Determine default meal type based on current time
const getDefaultMealType = (): MealLog['mealType'] => {
  const hour = new Date().getHours();
  const minutes = new Date().getMinutes();
  const time = hour + minutes / 60;
  
  if (time >= 8 && time < 10) return 'breakfast';      // 8:00 - 10:00
  if (time >= 11.5 && time < 13.5) return 'lunch';     // 11:30 - 13:30
  if (time >= 17 && time < 19) return 'dinner';        // 17:00 - 19:00
  return 'snack';                                       // Other times
};

const MealLogger: React.FC<MealLoggerProps> = ({ onLogMeal, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<MealLog['mealType']>(getDefaultMealType());
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      // Small timeout to ensure ref is attached if react renders slowly
      setTimeout(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
      }, 0);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please ensure you have granted camera permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const items = await analyzeFoodImage(image);
      setAnalyzedItems(items);
    } catch (error) {
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    const totalCalories = analyzedItems.reduce((acc, item) => acc + item.calories, 0);
    const log: MealLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      imageUrl: image || undefined,
      items: analyzedItems,
      totalCalories,
      mealType,
    };
    onLogMeal(log);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Utensils className="text-brand-500" size={20} />
            Log Meal
          </h2>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6">
          {isCameraOpen ? (
            <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] flex items-center justify-center">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8 z-20">
                         <button 
                            onClick={stopCamera} 
                            className="p-3 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <button 
                            onClick={capturePhoto} 
                            className="p-1 rounded-full border-4 border-white/50 hover:border-white transition-colors"
                        >
                            <div className="w-16 h-16 bg-white rounded-full shadow-lg"></div>
                        </button>
                         <div className="w-12"></div> {/* Spacer for alignment */}
                    </div>
                </div>
            </div>
          ) : !image ? (
            <div className="space-y-4">
               {/* Camera Option */}
               <button 
                 onClick={startCamera}
                 className="w-full bg-brand-50 border-2 border-brand-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-brand-100 transition-colors group"
               >
                 <div className="p-4 bg-white text-brand-600 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                   <Camera size={32} />
                 </div>
                 <div className="text-center">
                    <p className="font-bold text-brand-900 text-lg">Take Photo</p>
                    <p className="text-sm text-brand-600/70">Use your camera</p>
                 </div>
               </button>

               <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                </div>

               {/* Upload Option */}
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-gray-200 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-gray-50 text-gray-600 font-medium transition-colors"
              >
                <ImageIcon size={20} />
                Upload from Gallery
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
              </button>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <img src={image} alt="Meal" className="w-full h-64 object-cover opacity-90" />
              {analyzedItems.length === 0 && !isAnalyzing && (
                 <button 
                 onClick={() => setImage(null)}
                 className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm"
               >
                 <X size={16} />
               </button>
              )}
            </div>
          )}

          {/* Analysis State */}
          {image && analyzedItems.length === 0 && (
            <div className="text-center">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Upload size={20} /> Analyze Food
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {analyzedItems.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
               <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                      mealType === type ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <h3 className="font-semibold text-gray-700">Identified Items:</h3>
              <div className="space-y-3">
                {analyzedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-600">{item.calories}</p>
                      <p className="text-xs text-gray-400">kcal</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-4 bg-brand-50 rounded-lg border border-brand-100">
                <span className="font-semibold text-brand-900">Total Estimate</span>
                <span className="text-xl font-bold text-brand-700">
                  {analyzedItems.reduce((a, b) => a + b.calories, 0)} kcal
                </span>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-800"
              >
                <Check size={20} /> Save Meal Log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealLogger;