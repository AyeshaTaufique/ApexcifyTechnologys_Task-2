import React, { useState, useEffect } from 'react';
import { User, Post } from '../../types';
import { api } from '../../api';
import { Search, Compass, UserPlus, UserCheck, Sparkles, Flame, ShieldAlert, Award } from 'lucide-react';

interface DiscoverViewProps {
  currentUser: User | null;
  onUserClick: (userId: string) => void;
  onFollowToggle: (userId: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  posts: Post[];
}

export default function DiscoverView({
  currentUser,
  onUserClick,
  onFollowToggle,
  showToast,
  posts,
}: DiscoverViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [creators, setCreators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const performSearch = async () => {
    try {
      setLoading(true);
      const results = await api.searchUsers(searchQuery);
      setCreators(results);
    } catch (err: any) {
      showToast(err.message || 'Error occurred fetching database search', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounced or simple latency-supported search
    performSearch();
  }, [searchQuery, currentUser?.followingCount]);

  const handleFollowToggle = async (user: User) => {
    if (!currentUser) {
      showToast('Please sign in to follow creators!', 'error');
      return;
    }

    try {
      // Check if already followed
      const following = await api.getFollowing(currentUser.id);
      const isFollowing = following.some((f) => f.id === user.id);

      if (isFollowing) {
        await api.unfollowUser(user.id);
        showToast(`Unfollowed @${user.username}`, 'success');
      } else {
        await api.followUser(user.id);
        showToast(`You followed @${user.username}`, 'success');
      }
      onFollowToggle(user.id);
      performSearch();
    } catch (err: any) {
      showToast(err.message || 'Unreachable action', 'error');
    }
  };

  // Trending Topics preset
  const trendingTopics = [
    { tag: 'docker', count: '1.2k posts', color: 'bg-indigo-50 border-indigo-100 text-indigo-650' },
    { tag: 'designsystem', count: '840 posts', color: 'bg-purple-50 border-purple-100 text-purple-650' },
    { tag: 'venicephoto', count: '412 posts', color: 'bg-amber-50 border-amber-100 text-amber-650' },
    { tag: 'vite4', count: '1.5k posts', color: 'bg-rose-50 border-rose-100 text-rose-650' },
  ];

  return (
    <div className="space-y-6 w-full" id="discover-screen-layout">
      {/* 1. Interactive Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div>
          <h2 className="font-display font-extrabold text-[18px] tracking-tight text-slate-800 leading-tight">Explore VibeNet</h2>
          <p className="text-xs text-slate-400">Discover and network with developers, visual artists and designers.</p>
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            id="discover-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators by full name, niche, or @username..."
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* 2. Trending hashtags and topics presets (visual embellishment) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs select-none" id="discover-trending">
        <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight mb-3 flex items-center gap-1.5">
          <Flame className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
          <span>Trending hashtags</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {trendingTopics.map((topic) => (
            <div 
              key={topic.tag} 
              id={`trending-tag-${topic.tag}`}
              className={`p-3 border rounded-xl cursor-default transition-all hover:scale-[1.01] ${topic.color}`}
            >
              <p className="font-mono text-xs font-bold">#{topic.tag}</p>
              <span className="text-[10px] opacity-75">{topic.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Search Result Creators List */}
      <div className="space-y-4" id="discover-results-container">
        <h3 className="font-display font-semibold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
          <Award className="w-4.5 h-4.5 text-indigo-500" />
          <span>{searchQuery ? 'Matching creators' : 'Recommended accounts'}</span>
        </h3>

        {loading ? (
          <p className="text-xs text-slate-400 italic text-center py-6">Loading creators profiles from the server...</p>
        ) : creators.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center select-none" id="discover-empty-results">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-display font-semibold text-slate-800 text-xs">No users match your query</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">Try typing general letters or different names to find creator records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="discover-creators-grid">
            {creators.map((user) => {
              const isOwnCard = currentUser ? currentUser.id === user.id : false;
              // Check if currently followed (either via author list, or by directly checking follows database)
              const isFollowedByMe = posts.some((p) => p.authorId === user.id && p.isFollowingAuthor);

              return (
                <div 
                  key={user.id} 
                  id={`creator-card-${user.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div className="flex gap-3">
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName}
                      className="w-11 h-11 rounded-xl object-cover cursor-pointer ring-2 ring-slate-100"
                      onClick={() => onUserClick(user.id)}
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p 
                        onClick={() => onUserClick(user.id)}
                        className="font-display font-bold text-slate-800 text-xs hover:text-indigo-600 hover:underline cursor-pointer truncate"
                      >
                        {user.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">@{user.username}</p>
                    </div>

                    {/* Inline Follow action */}
                    {!isOwnCard && currentUser && (
                      <button
                        id={`discover-follow-btn-${user.id}`}
                        onClick={() => handleFollowToggle(user)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors shrink-0 h-fit ${
                          isFollowedByMe
                            ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
                        }`}
                        title={isFollowedByMe ? 'Unfollow' : 'Follow'}
                      >
                        {isFollowedByMe ? <UserCheck className="w-4 h-4 text-emerald-500" /> : <UserPlus className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-550 mt-3 line-clamp-2 leading-relaxed whitespace-pre-wrap select-text">
                    {user.bio || 'Product builder exploring open-source protocols, minimal web apps and clean layouts.'}
                  </p>

                  <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-xl mt-4 text-[10px] text-slate-500 font-mono">
                    <div>
                      <strong>{user.followersCount}</strong> Followers
                    </div>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <div>
                      <strong>{user.followingCount}</strong> Following
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
