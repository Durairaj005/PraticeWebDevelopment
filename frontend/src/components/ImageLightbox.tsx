import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const ImageLightbox = ({ isOpen, imageUrl, onClose }: ImageLightboxProps) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setScale(1), 200); // reset scale on close
    }
  }, [isOpen]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));

  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <div className="absolute top-6 right-6 flex gap-4 z-10">
            <button 
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <motion.div 
            className="relative w-full h-full flex items-center justify-center overflow-auto"
            onClick={onClose}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: scale, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              src={imageUrl}
              alt="Evidence Attachment"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl origin-center cursor-move"
              onClick={(e) => e.stopPropagation()}
              drag
              dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              dragElastic={0.2}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
