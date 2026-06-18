import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import { X, Image as ImageIcon, Sparkles, Send, Trash2 } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageUrl?: string) => void;
  editingPost: Post | null;
}

const PRESET_IMAGES = [
  { name: 'None', url: '' },
  { name: 'Mountain Alpine', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&h=500&q=80' },
  { name: 'Tokyo Neon', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&h=500&q=80' },
  { name: 'Cozy Workspace', url: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&h=500&q=80' },
  { name: 'Quiet Café', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&h=500&q=80' },
];

export default function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  editingPost,
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [error, setError] = useState('');

  // Prefill when editing
  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content);
      setImageUrl(editingPost.imageUrl || '');
      setShowImageInput(!!editingPost.imageUrl);
    } else {
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
    }
    setError('');
  }, [editingPost, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }
    onSubmit(content, imageUrl.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="create-post-modal-overlay">
      <div 
        id="create-post-modal-container"
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="font-display font-bold text-slate-800 text-base">
              {editingPost ? 'Edit Post Content' : 'Compose New Post'}
            </h2>
          </div>
          <button 
            id="modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <p id="modal-validation-error" className="text-xs font-semibold text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
              {error}
            </p>
          )}

          {/* Text Area */}
          <div>
            <textarea
              id="modal-post-textarea"
              rows={4}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError('');
              }}
              placeholder="What is on your mind? Share an update, open-source project, or architectural ideas..."
              className="w-full text-slate-800 placeholder-slate-400 text-sm border border-slate-200 rounded-xl p-3.5 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              autoFocus
            />
          </div>

          {/* Optional Image Url toggle */}
          <div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                id="toggle-image-input-btn"
                onClick={() => setShowImageInput(!showImageInput)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>{showImageInput ? 'Hide image options' : 'Add visual attachment'}</span>
              </button>
              
              {imageUrl && (
                <button
                  type="button"
                  id="clear-image-btn"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-rose-500 font-semibold hover:underline"
                >
                  Clear Image
                </button>
              )}
            </div>

            {showImageInput && (
              <div className="mt-3.5 space-y-3.5 bg-slate-50 border border-slate-150 p-4 rounded-xl">
                {/* Text input to paste image */}
                <div>
                  <label htmlFor="modal-image-input" className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Paste Custom Photo URL</label>
                  <input
                    id="modal-image-input"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/your-custom-image-url..."
                    className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Grid of beautiful quick seed photo presets */}
                <div>
                  <span className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-400 mb-2">Or select a crisp backdrop preset:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.name}
                        type="button"
                        id={`preset-img-btn-${img.name.toLowerCase().replace(/\s/g, '-')}`}
                        onClick={() => setImageUrl(img.url)}
                        className={`px-2.5 py-2 text-[11px] font-medium border rounded-lg text-left truncate transition-all ${
                          imageUrl === img.url 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Image if valid */}
                {imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-36 relative">
                    <img 
                      src={imageUrl} 
                      alt="Attachment preview" 
                      className="w-full h-full object-cover max-h-36"
                      onError={() => setError('Invalid image URL format')}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2 select-none">
            <button
              id="modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              id="modal-submit-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-150 hover:-translate-y-[1px] active:translate-y-0 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{editingPost ? 'Save Updates' : 'Publish Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
