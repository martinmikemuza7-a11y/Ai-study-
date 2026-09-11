/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Image as ImageIcon, Sparkles, Palette } from 'lucide-react';
import { PRESET_FOLDER_IMAGES, FolderPresetImage } from '../lib/courseImages';

interface CoverImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedImageUrl: string;
  onSelectImage: (preset: FolderPresetImage) => void;
  folderName?: string;
}

export const CoverImageSelectorModal: React.FC<CoverImageSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedImageUrl,
  onSelectImage,
  folderName = 'Study Folder',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Select 2D Illustrated Cover Picture
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-semibold">
                    {PRESET_FOLDER_IMAGES.length} 2D Presets
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pick a 2D aesthetic cover artwork for "{folderName}"
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid of 2D Cover Pictures */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PRESET_FOLDER_IMAGES.map((preset) => {
                const isSelected = selectedImageUrl === preset.url;

                return (
                  <motion.div
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectImage(preset);
                      onClose();
                    }}
                    className={`group relative rounded-2xl border-2 transition overflow-hidden cursor-pointer flex flex-col ${
                      isSelected
                        ? 'border-indigo-600 ring-4 ring-indigo-500/25 bg-indigo-50/30 dark:bg-indigo-950/30 shadow-lg'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 shadow-xs'
                    }`}
                  >
                    {/* Picture Preview */}
                    <div className="relative h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3" /> Active Cover
                        </div>
                      )}

                      {/* Style tag */}
                      <span className="absolute bottom-2 left-2.5 text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs font-semibold">
                        {preset.style}
                      </span>
                    </div>

                    {/* Metadata text */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {preset.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                          <span>Theme Match</span>
                        </p>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Use'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50">
            <span>Click any 2D cover picture to apply it immediately</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
