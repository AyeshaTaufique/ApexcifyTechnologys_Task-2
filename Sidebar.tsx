import { User, Post } from '../types';
import { UserPlus, Heart } from 'lucide-react';
import { api } from '../api';
import { useEffect, useState } from 'react';

interface SidebarProps {
  currentUser: User;
  onUserClick: (userId: string) => void;
  onRefreshFeed: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  posts: Post[];
}

export default function Sidebar({ currentUser, onUserClick, onRefreshFeed, showToast, posts }: SidebarProps) {
  // Local state to force re-render when currentUser changes
  const [followersCount, setFollowersCount] = useState(currentUser.followersCount ?? 0);
  const [followingCount, setFollowingCount] = useState(currentUser.followingCount ?? 0);
  const [userPostsCount, setUserPostsCount] = useState(posts.filter(p => p.authorId === currentUser.id).length);

  // Update local counts when currentUser changes
  useEffect(() => {
    setFollowersCount(currentUser.followersCount ?? 0);
    setFollowingCount(currentUser.followingCount ?? 0);
  }, [currentUser.followersCount, currentUser.followingCount]);

  // Update posts count when posts change
  useEffect(() => {
    setUserPostsCount(posts.filter(p => p.authorId === currentUser.id).length);
  }, [posts, currentUser.id]);

  // Suggested users
  const suggestedUsers = () => {
    const followedIds = new Set(posts.filter(p => p.isFollowingAuthor).map(p => p.authorId));
    const uniqueAuthors = Array.from(new Map(posts.map(p => [p.authorId, p])).values());
    return uniqueAuthors
      .filter(p => p.authorId !== currentUser.id && !followedIds.has(p.authorId))
      .slice(0, 5);
  };

  const handleFollowFromSuggestion = async (userId: string) => {
    try {
      await api.followUser(userId);
      showToast('Followed successfully', 'success');
      onRefreshFeed();
      // Also refresh sidebar counts
      const refreshed = await api.getUser(currentUser.id);
      setFollowersCount(refreshed.followersCount ?? 0);
      setFollowingCount(refreshed.followingCount ?? 0);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="w-80 space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={currentUser.profileImage}
            alt={currentUser.fullName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-100"
          />
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{currentUser.fullName}</h3>
            <p className="text-xs text-slate-500">@{currentUser.username}</p>
          </div>
        </div>
        <div className="flex justify-around pt-3 border-t border-slate-100">
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">{followersCount}</p>
            <p className="text-xs text-slate-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">{followingCount}</p>
            <p className="text-xs text-slate-500">Following</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">{userPostsCount}</p>
            <p className="text-xs text-slate-500">Posts</p>
          </div>
        </div>
      </div>

      {/* Who to follow */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Who to follow
        </h3>
        <div className="space-y-3">
          {suggestedUsers().map(suggestion => (
            <div key={suggestion.authorId} className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => onUserClick(suggestion.authorId)}>
                <img src={suggestion.authorImage} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{suggestion.authorName}</p>
                  <p className="text-xs text-slate-500">@{suggestion.authorId.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={() => handleFollowFromSuggestion(suggestion.authorId)}
                className="text-xs px-3 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Follow
              </button>
            </div>
          ))}
          {suggestedUsers().length === 0 && (
            <p className="text-xs text-slate-400 text-center">No suggestions right now</p>
          )}
        </div>
      </div>

      {/* Community Pulse */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          Community Pulse
        </h3>
        <div className="space-y-2 text-xs text-slate-600">
          <p>📊 Total posts: {posts.length}</p>
          <p>❤️ Total likes: {posts.reduce((sum, p) => sum + p.likesCount, 0)}</p>
          <p>💬 Total comments: {posts.reduce((sum, p) => sum + p.commentsCount, 0)}</p>
        </div>
      </div>
    </div>
  );
}