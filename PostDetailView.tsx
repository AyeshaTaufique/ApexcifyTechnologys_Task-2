import React, { useState, useEffect } from 'react';
import { Post, User } from '../../types';
import { api } from '../../api';
import CommentBox from '../CommentBox';
import { Heart, MessageSquare, ChevronLeft, Clock, Calendar, Sparkles } from 'lucide-react';

interface PostDetailViewProps {
  postId: string;
  currentUser: User | null;
  onBack: () => void;
  onLikeToggle: (postId: string) => void;
  onUserClick: (userId: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function PostDetailView({
  postId,
  currentUser,
  onBack,
  onLikeToggle,
  onUserClick,
  showToast,
}: PostDetailViewProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getPost(postId);
      setPost(data);
    } catch (err: any) {
      showToast(err.message || 'Error occurred loading comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  const handleLike = () => {
    if (!post) return;
    onLikeToggle(post.id);
    // Locally adjust to keep it snappy
    setPost((prev) => {
      if (!prev) return null;
      const willBeLiked = !prev.isLiked;
      return {
        ...prev,
        isLiked: willBeLiked,
        likesCount: willBeLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
      };
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center animate-pulse space-y-4" id="post-detail-loader">
        <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto" />
        <div className="h-2 bg-slate-100 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center" id="post-detail-error">
        <p className="text-xs text-slate-500 font-medium">Post could not be retrieved.</p>
        <button
          id="post-detail-fail-back-btn"
          onClick={onBack}
          className="mt-4 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full" id={`post-details-screen-${postId}`}>
      {/* Back button wrapper */}
      <div className="select-none">
        <button
          id="post-details-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Feed</span>
        </button>
      </div>

      {/* Main detailed Post Card */}
      <article className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs" id="post-detail-card">
        {/* Header author details */}
        <div className="flex items-center gap-3.5 mb-5 border-b border-slate-100 pb-4">
          <img 
            src={post.authorImage} 
            alt={post.authorName}
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 cursor-pointer hover:scale-105 transition-transform" 
            onClick={() => onUserClick(post.authorId)}
            referrerPolicy="no-referrer"
          />
          <div>
            <h3 
              onClick={() => onUserClick(post.authorId)}
              className="font-display font-bold text-slate-800 text-sm tracking-tight cursor-pointer hover:text-indigo-600 hover:underline"
            >
              {post.authorName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
              <span>@{post.id.startsWith('post-') ? 'author_' + post.authorName.toLowerCase().replace(/\s/g, '') : 'user'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-350" />
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed textual content */}
        <div className="space-y-4">
          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap select-text">
            {post.content}
          </p>

          {post.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-120">
              <img 
                src={post.imageUrl} 
                alt="Post content visualization" 
                className="w-full h-full object-cover max-h-120"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Dynamic metrics block */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-100 select-none text-slate-500">
          {/* Like Interaction inside detail page */}
          <button
            id="detail-post-like-btn"
            onClick={handleLike}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer group/like-btn ${
              post.isLiked ? 'text-rose-600 bg-rose-50' : 'hover:text-rose-600 hover:bg-rose-50/50'
            }`}
          >
            <Heart className={`w-5 h-5 transition-transform group-hover/like-btn:scale-110 ${post.isLiked ? 'fill-rose-650 text-rose-650' : 'text-slate-400'}`} />
            <span>Liked by <strong className="font-mono">{post.likesCount}</strong> people</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 text-slate-400">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <span>Replies <strong className="font-mono">{post.commentsCount}</strong></span>
          </div>
        </div>
      </article>

      {/* Discussion forum thread box containing input replies */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs" id="post-detail-comments-box">
        <CommentBox
          postId={post.id}
          currentUser={currentUser}
          onCommentsUpdated={fetchPostDetails}
          showToast={showToast}
        />
      </div>
    </div>
  );
}
