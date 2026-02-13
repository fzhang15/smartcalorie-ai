import React, { useState } from 'react';
import { X, Utensils, PenLine, Trash2, Edit3, Check, Plus, Minus } from 'lucide-react';
import { MealLog, FoodItem } from '../types';
import { useSwipeToClose } from '../hooks/useSwipeToClose';
import { useImageUrl } from '../hooks/useImageUrl';

interface MealLogDetailProps {
  log: MealLog;
  onClose: () => void;
  onDelete: (logId: string) => void;
  onEdit?: (logId: string, updates: Partial<MealLog>) => void;
  onImageClick?: (imageUrl: string) => void;
}

const MealLogDetail: React.FC<MealLogDetailProps> = ({ log, onClose, onDelete, onEdit, onImageClick }) => {
  const swipe = useSwipeToClose(onClose);
  const resolvedImageUrl = useImageUrl(log.imageUrl);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<FoodItem[]>(log.items);
  const [editMealType, setEditMealType] = useState<MealLog['mealType']>(log.mealType);

  const items = isEditing ? editItems : log.items;
  const mealType = isEditing ? editMealType : log.mealType;
  
  const totalProtein = items.reduce((a, b) => a + b.protein, 0);
  const totalCarbs = items.reduce((a, b) => a + b.carbs, 0);
  const totalFat = items.reduce((a, b) => a + b.fat, 0);
  const totalCalories = items.reduce((a, b) => a + b.calories, 0);

  const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleStartEdit = () => {
    setEditItems([...log.items.map(item => ({ ...item }))]);
    setEditMealType(log.mealType);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditItems(log.items);
    setEditMealType(log.mealType);
  };

  const handleSaveEdit = () => {
    if (!onEdit) return;
    onEdit(log.id, {
      items: editItems,
      mealType: editMealType,
      totalCalories: editItems.reduce((acc, item) => acc + item.calories, 0),
    });
    setIsEditing(false);
    onClose();
  };

  const updateItem = (idx: number, field: keyof FoodItem, value: string | number) => {
    setEditItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: typeof value === 'string' ? value : Number(value) } : item
    ));
  };

  const removeItem = (idx: number) => {
    if (editItems.length <= 1) return; // Must keep at least one item
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setEditItems(prev => [...prev, { name: 'New item', calories: 0, protein: 0, carbs: 0, fat: 0 }]);
  };

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
              {isEditing ? 'Edit Meal' : mealType}
            </h2>
            <p className="text-xs text-gray-500">{timeStr}</p>
          </div>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors flex items-center gap-1">
                  <Check size={14} /> Save
                </button>
              </>
            ) : (
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>

        <div ref={swipe.scrollContainerRef} className="overflow-y-auto p-4 space-y-4">
          {/* Image or Description */}
          {log.imageUrl ? (
            <div
              className="rounded-xl overflow-hidden bg-gray-100 cursor-pointer active:opacity-80 transition-opacity"
              onClick={() => !isEditing && onImageClick?.(log.imageUrl!)}
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

          {/* Health Score (read-only, shown when available) */}
          {!isEditing && log.healthScore != null && log.healthScore > 0 && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              log.healthScore >= 8 ? 'bg-green-50 border-green-200' :
              log.healthScore >= 5 ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                log.healthScore >= 8 ? 'bg-green-500' :
                log.healthScore >= 5 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}>
                {log.healthScore}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${
                    log.healthScore >= 8 ? 'text-green-700' :
                    log.healthScore >= 5 ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    Health Score: {log.healthScore}/10
                  </span>
                  <span>{log.healthScore >= 8 ? '🟢' : log.healthScore >= 5 ? '🟡' : '🔴'}</span>
                </div>
                {log.healthNote && (
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{log.healthNote}</p>
                )}
              </div>
            </div>
          )}

          {/* Meal Type Selector (edit mode only) */}
          {isEditing && (
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setEditMealType(type)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                    editMealType === type ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* Food Items */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${isEditing ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        className="font-medium text-gray-800 bg-transparent border-b border-gray-300 focus:border-brand-500 focus:outline-none flex-1 min-w-0"
                      />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          value={item.calories}
                          onChange={(e) => updateItem(idx, 'calories', parseInt(e.target.value) || 0)}
                          className="font-bold text-brand-600 bg-transparent border-b border-gray-300 focus:border-brand-500 focus:outline-none text-right w-16"
                        />
                        <span className="text-xs text-gray-400">kcal</span>
                      </div>
                      {editItems.length > 1 && (
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                        >
                          <Minus size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">P:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={item.protein}
                          onChange={(e) => updateItem(idx, 'protein', parseFloat(e.target.value) || 0)}
                          className="text-gray-700 bg-transparent border-b border-gray-300 focus:border-brand-500 focus:outline-none w-12 text-center"
                        />
                        <span className="text-gray-500">g</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">C:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={item.carbs}
                          onChange={(e) => updateItem(idx, 'carbs', parseFloat(e.target.value) || 0)}
                          className="text-gray-700 bg-transparent border-b border-gray-300 focus:border-brand-500 focus:outline-none w-12 text-center"
                        />
                        <span className="text-gray-500">g</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">F:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={item.fat}
                          onChange={(e) => updateItem(idx, 'fat', parseFloat(e.target.value) || 0)}
                          className="text-gray-700 bg-transparent border-b border-gray-300 focus:border-brand-500 focus:outline-none w-12 text-center"
                        />
                        <span className="text-gray-500">g</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="font-bold text-brand-600 text-sm">{item.calories} <span className="text-xs text-gray-400 font-normal">kcal</span></span>
                    </div>
                    <div className="flex gap-3 text-xs mt-1.5">
                      <span className="text-green-600">P: {item.protein}g</span>
                      <span className="text-yellow-600">C: {item.carbs}g</span>
                      <span className="text-red-500">F: {item.fat}g</span>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add Item Button (edit mode) */}
            {isEditing && (
              <button
                onClick={addItem}
                className="w-full p-2.5 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <Plus size={14} /> Add Item
              </button>
            )}
          </div>

          {/* Total Summary */}
          <div className="p-4 bg-brand-50 rounded-lg border border-brand-100">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-brand-900">Total</span>
              <span className="text-xl font-bold text-brand-700">{totalCalories} <span className="text-sm font-normal">kcal</span></span>
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

          {/* Action Buttons */}
          {!isEditing && (
            <div className="space-y-2">
              {onEdit && (
                <button
                  onClick={handleStartEdit}
                  className="w-full py-3 rounded-lg border border-brand-200 text-brand-600 font-medium flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors"
                >
                  <Edit3 size={16} />
                  Edit Meal
                </button>
              )}
              <button
                onClick={() => { onDelete(log.id); onClose(); }}
                className="w-full py-3 rounded-lg border border-red-200 text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                Delete Meal Log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealLogDetail;
