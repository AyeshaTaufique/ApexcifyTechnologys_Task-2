import React, { useState, useEffect } from 'react';
import { Post, User } from '../../types';
import PostCard from '../PostCard';
import { Compass, Users, Sparkles, Send, ImageIcon, MessageSquare } from 'lucide-react';
import { api } from '../../api';

interface FeedViewProps {
  currentUser: User | null;
  posts: Post[];
  loading: boolean;
  onLikeToggle: (postId: string) => void;
  onFollowToggle: (authorId: string) => void;
  onPostClick: (postId: string) => void;
  onUserClick: (userId: string) => void;
  onEditClick: (post: Post) => void;
  onDeleteClick: (postId: string) => void;
  onCreatePostSubmit: (content: string, imageUrl?: string) => void;
  onRefreshFeed: () => void;
}

export default function FeedView({
  currentUser,
  posts,
  loading,
  onLikeToggle,
  onFollowToggle,
  onPostClick,
  onUserClick,
  onEditClick,
  onDeleteClick,
  onCreatePostSubmit,
  onRefreshFeed,
}: FeedViewProps) {
  const [activeTab, setActiveTab] = useState<'discover' | 'following'>('discover');
  const [quickContent, setQuickContent] = useState('');
  const [quickImageUrl, setQuickImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  // Filter posts depending on active tab
  const displayedPosts = posts.filter((post) => {
    if (activeTab === 'discover') return true;
    // following tab: show posts where isFollowingAuthor is true or author is own user
    return post.isFollowingAuthor || (currentUser && post.authorId === currentUser.id);
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickContent.trim()) return;
    
    onCreatePostSubmit(quickContent, quickImageUrl.trim() || undefined);
    setQuickContent('');
    setQuickImageUrl('');
    setShowImageInput(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full" id="timeline-feed-view">
      {/* 1. Header with View Category Selection Tab */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex gap-1 shadow-xs select-none" id="feed-timeline-tabs">
        <button
          id="feed-tab-discover"
          onClick={() => {
            setActiveTab('discover');
            onRefreshFeed();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
            activeTab === 'discover'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Discover Hub</span>
        </button>

        <button
          id="feed-tab-following"
          onClick={() => {
            setActiveTab('following');
            onRefreshFeed();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
            activeTab === 'following'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My Circle</span>
        </button>
      </div>

      {/* 2. Quick Drafting Card (only for logged-in user at the top) */}
      {currentUser && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" id="quick-composer-card">
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="flex gap-3">
              <img 
                src={currentUser.profileImage} 
                alt={currentUser.fullName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-50"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <textarea
                  id="feed-quick-textarea"
                  rows={2}
                  value={quickContent}
                  onChange={(e) => setQuickContent(e.target.value)}
                  placeholder={`Share something interesting today, ${currentUser.fullName.split(' ')[0]}...`}
                  className="w-full text-slate-800 placeholder-slate-400 text-[15px] border-none focus:ring-0 focus:outline-none p-2 resize-none"
                />
              </div>
            </div>

            {/* In-line Custom Image URL Field */}
            {showImageInput && (
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex gap-2 items-center" id="quick-image-field">
                <input
                  id="feed-quick-image-input"
                  type="url"
                  value={quickImageUrl}
                  onChange={(e) => setQuickImageUrl(e.target.value)}
                  placeholder="Paste Unsplash or custom image web address..."
                  className="flex-1 bg-white border border-slate-250 text-xs px-3 py-1.5 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
                {quickImageUrl && (
                  <button 
                    type="button" 
                    id="clear-quick-image-btn"
                    onClick={() => setQuickImageUrl('')} 
                    className="text-[10px] text-rose-500 font-bold hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Action buttons footer */}
            <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 select-none">
              <button
                type="button"
                id="quick-image-toggle-btn"
                onClick={() => setShowImageInput(!showImageInput)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  showImageInput ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Add Graphic Banner</span>
              </button>

              <button
                id="feed-quick-publish-btn"
                type="submit"
                disabled={!quickContent.trim()}
                className='px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs shadow-md shadow-indigo-100 focus:translate-y-0 active:translate-y-[1px] hover:-translate-y-[1px] cursor-pointer transition-all flex items-center gap-1'
              >
                <span>Publish</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Feed Streams List */}
      <div className="space-y-4" id="feed-posts-container">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-2 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center select-none" id="empty-feed-placeholder">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            
            <h3 className="font-display font-semibold text-slate-800 text-sm tracking-tight mb-1">
              {activeTab === 'following' ? 'Your Circle is empty' : 'No posts found'}
            </h3>
            
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {activeTab === 'following' 
                ? 'Follow suggestions in Discover or the sidebar to see posts from people you follow!'
                : 'Write the very first post on this platform by using the writer box above!'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLikeToggle={onLikeToggle}
                onFollowToggle={onFollowToggle}
                onPostClick={onPostClick}
                onUserClick={onUserClick}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
