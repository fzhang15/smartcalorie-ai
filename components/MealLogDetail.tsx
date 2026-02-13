import React from 'react';
import { X, Utensils, PenLine, Trash2 } from 'lucide-react';
import { MealLog } from '../types';
import { useSwipeToClose } from '../hooks/useSwipeToClose';
import { useImageUrl } from '../hooks/useImageUrl';

interface MealLogDetailProps {
  log: MealLog;
  onClose: () => void;
  onDelete: (logId: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

const MealLogDetail: React.FC<MealLogDetailProps> = ({ log, onClose, onDelete, onImageClick }) => {
  const swipe = useSwipeToClose(onClose);
  const resolvedImageUrl = useImageUrl(log.imageUrl);
  const totalProtein = log.items.reduce((a, b) => a + b.protein, 0);
  const totalCarbs = log.items.reduce((a, b) => a + b.carbs, 0);
  const totalFat = log.items.reduce((a, b) => a + b.fat, 0);

  const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 sm:pb-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-[1.25rem] sm:rounded-[1.25rem] shadow-elevated overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in-95 sm:slide-in-from-bottom-0"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <div className="drag-handle sm:hidden" />
        {/* Header */}
        <div className="px-5 pb-4 pt-2 sm:pt-4 sm:px-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 capitalize">
              <Utensils className="text-brand-500" size={20} />
              {log.mealType}
            </h2>
            <p className="text-xs text-gray-500">{timeStr}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div ref={swipe.scrollContainerRef} className="overflow-y-auto p-4 space-y-4">
          {/* Image or Description */}
          {log.imageUrl ? (
            <div
              className="rounded-xl overflow-hidden bg-gray-100 cursor-pointer active:opacity-80 transition-opacity"
              onClick={() => onImageClick?.(log.imageUrl!)}
            >
              {resolvedImageUrl ? (
                <img
                  src={resolvedImageUrl}
                  alt="Meal"
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center animate-pulse">
                  <Utensils size={32} className="text-gray-300" />
                </div>
              )}
            </div>
          ) : log.description ? (
            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
              <div className="flex items-center gap-2 text-brand-600 mb-2">
                <PenLine size={16} />
                <span className="text-sm font-medium">Description</span>
              </div>
              <p className="text-gray-700 text-sm">{log.description}</p>
            </div>
          ) : null}

          {/* Food Items */}
          <div className="space-y-2">
            {log.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="font-bold text-brand-600 text-sm">{item.calories} <span className="text-xs text-gray-400 font-normal">kcal</span></span>
                </div>
                <div className="flex gap-3 text-xs mt-1.5">
                  <span className="text-green-600">P: {item.protein}g</span>
                  <span className="text-yellow-600">C: {item.carbs}g</span>
                  <span className="text-red-500">F: {item.fat}g</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="p-4 bg-brand-50 rounded-lg border border-brand-100">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-brand-900">Total</span>
              <span className="text-xl font-bold text-brand-700">{log.totalCalories} <span className="text-sm font-normal">kcal</span></span>
            </div>
            <div className="flex gap-4 text-xs mt-2">
              <span className="text-green-600 font-medium">P: {Math.round(totalProtein)}g</span>
              <span className="text-yellow-600 font-medium">C: {Math.round(totalCarbs)}g</span>
              <span className="text-red-500 font-medium">F: {Math.round(totalFat)}g</span>
            </div>
          </div>

          {/* Portion Info */}
          {log.portionRatio != null && log.portionRatio < 1 && (
            <p className="text-xs text-gray-500 text-center">
              Portion: {Math.round(log.portionRatio * 100)}% of total meal
            </p>
          )}

          {/* Delete Button */}
          <button
            onClick={() => { onDelete(log.id); onClose(); }}
            className="w-full py-3 rounded-lg border border-red-200 text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
            Delete Meal Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealLogDetail;