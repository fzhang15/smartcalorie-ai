import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, Loader2, Utensils, Image as ImageIcon, Users } from 'lucide-react';
import { analyzeFoodImage } from '../services/geminiService';
import { FoodItem, MealLog } from '../types';

type PortionOption = 1 | 2 | 3 | 4 | 'custom';

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

// Analyzing tips that rotate during AI analysis
const ANALYZING_TIPS = [
  "Identifying food items...",
  "Analyzing nutritional content...",
  "Calculating calories...",
  "AI is working hard...",
  "Detecting food types...",
  "Estimating portion sizes...",
];

const MealLogger: React.FC<MealLoggerProps> = ({ onLogMeal, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<MealLog['mealType']>(getDefaultMealType());
  const [analyzingTipIndex, setAnalyzingTipIndex] = useState(0);
  
  // Portion/Sharing State
  const [portionOption, setPortionOption] = useState<PortionOption>(1);
  const [customRatio, setCustomRatio] = useState(50); // percentage 10-100
  
  // Calculate actual portion ratio
  const portionRatio = portionOption === 'custom' 
    ? customRatio / 100 
    : 1 / portionOption;
  
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

  // Rotate analyzing tips while analyzing
  useEffect(() => {
    if (!isAnalyzing) {
      setAnalyzingTipIndex(0);
      return;
    }
    
    const interval = setInterval(() => {
      setAnalyzingTipIndex(prev => (prev + 1) % ANALYZING_TIPS.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isAnalyzing]);

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
      const video = videoRef.current;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Calculate the square crop area (centered)
      const size = Math.min(videoWidth, videoHeight);
      const offsetX = (videoWidth - size) / 2;
      const offsetY = (videoHeight - size) / 2;
      
      // Create canvas with square dimensions
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw only the square portion from the center of the video
        ctx.drawImage(
          video,
          offsetX, offsetY, size, size,  // Source: square from center
          0, 0, size, size               // Destination: full canvas
        );
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
    const originalTotalCalories = analyzedItems.reduce((acc, item) => acc + item.calories, 0);
    const adjustedTotalCalories = Math.round(originalTotalCalories * portionRatio);
    
    // Adjust each item's calories based on portion ratio
    const adjustedItems = analyzedItems.map(item => ({
      ...item,
      calories: Math.round(item.calories * portionRatio),
      protein: Math.round(item.protein * portionRatio * 10) / 10,
      carbs: Math.round(item.carbs * portionRatio * 10) / 10,
      fat: Math.round(item.fat * portionRatio * 10) / 10,
    }));
    
    const log: MealLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      imageUrl: image || undefined,
      items: adjustedItems,
      totalCalories: adjustedTotalCalories,
      mealType,
      portionRatio: portionRatio,
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
                <div className="relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted
                        className="w-full h-full object-cover"
                    />
                    {/* Square bounding box overlay - full area indicator */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Border around the entire capture area */}
                      <div className="absolute inset-2 border-2 border-white/80 rounded-lg">
                        {/* Corner markers */}
                        <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                        <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                        <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
                      </div>
                      {/* Helper text */}
                      <div className="absolute top-4 left-0 right-0 text-center">
                        <span className="text-white/80 text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
                          Position food in frame
                        </span>
                      </div>
                    </div>
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
            <div className={`relative rounded-xl overflow-hidden bg-gray-100 aspect-square flex items-center justify-center ${isAnalyzing ? 'ring-4 ring-brand-400 animate-pulse' : ''}`}>
              <img src={image} alt="Meal" className="w-full h-full object-cover" />
              
              {/* Scanning animation overlay during analysis */}
              {isAnalyzing && (
                <>
                  {/* Scanning line */}
                  <div 
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-80"
                    style={{
                      animation: 'scanLine 2s ease-in-out infinite',
                    }}
                  />
                  {/* Overlay with shimmer effect */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-b from-brand-500/10 via-transparent to-brand-500/10"
                    style={{
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                  {/* Corner indicators */}
                  <div className="absolute inset-2 border-2 border-brand-400/50 rounded-lg animate-pulse">
                    <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-brand-500 rounded-tl" />
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-brand-500 rounded-tr" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-brand-500 rounded-bl" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-brand-500 rounded-br" />
                  </div>
                  {/* Status text on image */}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="bg-black/60 text-white text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm">
                      {ANALYZING_TIPS[analyzingTipIndex]}
                    </span>
                  </div>
                </>
              )}
              
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
            <div className="text-center space-y-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`w-full bg-brand-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${isAnalyzing ? 'opacity-90' : 'hover:bg-brand-700'}`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span className="animate-pulse">{ANALYZING_TIPS[analyzingTipIndex]}</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} /> Analyze Food
                  </>
                )}
              </button>
              {isAnalyzing && (
                <p className="text-xs text-gray-500 animate-pulse">
                  This may take a few seconds...
                </p>
              )}
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

              {/* Portion/Sharing Selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Users size={16} />
                  <span className="text-sm font-medium">用餐人数</span>
                </div>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  {([1, 2, 3, 4, 'custom'] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => setPortionOption(option)}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                        portionOption === option 
                          ? 'bg-white text-brand-700 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {option === 'custom' ? '自定义' : `${option}人`}
                    </button>
                  ))}
                </div>
                
                {/* Custom Ratio Slider */}
                {portionOption === 'custom' && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">我的份额</span>
                      <span className="text-sm font-bold text-brand-600">{customRatio}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={customRatio}
                      onChange={(e) => setCustomRatio(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>10%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
                
                {/* Show portion info when not 100% */}
                {portionRatio < 1 && (
                  <p className="text-xs text-gray-500 text-center">
                    热量将按 {Math.round(portionRatio * 100)}% 计算 (原始热量 × {portionRatio.toFixed(2)})
                  </p>
                )}
              </div>

              <h3 className="font-semibold text-gray-700">Identified Items:</h3>
              <p className="text-xs text-gray-500 -mt-2 mb-2">Tap values to edit if AI estimate is incorrect</p>
              <div className="space-y-3">
                {analyzedItems.map((item, idx) => {
                  const adjustedCalories = Math.round(item.calories * portionRatio);
                  
                  const updateItem = (field: keyof FoodItem, value: string | number) => {
                    setAnalyzedItems(prev => prev.map((it, i) => 
                      i === idx ? { ...it, [field]: typeof value === 'string' ? value : Number(value) } : it
                    ));
                  };
                  
                  return (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                      <div className="flex justify-between items-start">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem('name', e.target.value)}
                          className="font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-500 focus:outline-none w-full max-w-[180px]"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.calories}
                            onChange={(e) => updateItem('calories', parseInt(e.target.value) || 0)}
                            className="font-bold text-brand-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-500 focus:outline-none text-right w-16"
                          />
                          <span className="text-xs text-gray-400">kcal</span>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">P:</span>
                          <input
                            type="number"
                            step="0.1"
                            value={item.protein}
                            onChange={(e) => updateItem('protein', parseFloat(e.target.value) || 0)}
                            className="text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-500 focus:outline-none w-12 text-center"
                          />
                          <span className="text-gray-500">g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">C:</span>
                          <input
                            type="number"
                            step="0.1"
                            value={item.carbs}
                            onChange={(e) => updateItem('carbs', parseFloat(e.target.value) || 0)}
                            className="text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-500 focus:outline-none w-12 text-center"
                          />
                          <span className="text-gray-500">g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">F:</span>
                          <input
                            type="number"
                            step="0.1"
                            value={item.fat}
                            onChange={(e) => updateItem('fat', parseFloat(e.target.value) || 0)}
                            className="text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-500 focus:outline-none w-12 text-center"
                          />
                          <span className="text-gray-500">g</span>
                        </div>
                      </div>
                      {portionRatio < 1 && (
                        <p className="text-xs text-gray-400">
                          After portion: {adjustedCalories} kcal • P: {Math.round(item.protein * portionRatio * 10) / 10}g • C: {Math.round(item.carbs * portionRatio * 10) / 10}g • F: {Math.round(item.fat * portionRatio * 10) / 10}g
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center p-4 bg-brand-50 rounded-lg border border-brand-100">
                <div>
                  <span className="font-semibold text-brand-900">Total Estimate</span>
                  {portionRatio < 1 && (
                    <p className="text-xs text-brand-600/70">
                      原始: {analyzedItems.reduce((a, b) => a + b.calories, 0)} kcal × {Math.round(portionRatio * 100)}%
                    </p>
                  )}
                </div>
                <span className="text-xl font-bold text-brand-700">
                  {Math.round(analyzedItems.reduce((a, b) => a + b.calories, 0) * portionRatio)} kcal
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

// Add CSS keyframes for scanning animation
const style = document.createElement('style');
style.textContent = `
  @keyframes scanLine {
    0%, 100% { top: 0; opacity: 0; }
    10% { opacity: 0.8; }
    50% { top: calc(100% - 4px); opacity: 0.8; }
    60% { opacity: 0; }
  }
  
  @keyframes shimmer {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
`;
if (!document.querySelector('#meal-logger-animations')) {
  style.id = 'meal-logger-animations';
  document.head.appendChild(style);
}
