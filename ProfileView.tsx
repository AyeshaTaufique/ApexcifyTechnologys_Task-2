import React, { useState, useEffect } from 'react';
import { User, Post } from '../../types';
import { api } from '../../api';
import PostCard from '../PostCard';
import { Edit3, Check, X, ShieldCheck, Grid, List, Users, BookOpen, UserCheck, UserPlus, Heart, MessageCircle } from 'lucide-react';

interface ProfileViewProps {
  userId: string;
  currentUser: User | null;
  posts: Post[];
  loadingPosts: boolean;
  onLikeToggle: (postId: string) => void;
  onFollowToggle: (authorId: string) => void;
  onPostClick: (postId: string) => void;
  onUserClick: (userId: string) => void;
  onEditClick: (post: Post) => void;
  onDeleteClick: (postId: string) => void;
  onProfileUpdated: (updatedUser: User) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ProfileView({
  userId,
  currentUser,
  posts,
  loadingPosts,
  onLikeToggle,
  onFollowToggle,
  onPostClick,
  onUserClick,
  onEditClick,
  onDeleteClick,
  onProfileUpdated,
  showToast,
}: ProfileViewProps) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isFollowedByCurrent, setIsFollowedByCurrent] = useState(false); // ✅ separate state for follow status

  const [isEditing, setIsEditing] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedImage, setEditedImage] = useState('');
  const [updating, setUpdating] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');

  const [layoutView, setLayoutView] = useState<'list' | 'grid'>('list');

  const [socialModalType, setSocialModalType] = useState<'followers' | 'following' | null>(null);
  const [socialList, setSocialList] = useState<User[]>([]);
  const [loadingSocialList, setLoadingSocialList] = useState(false);

  const isOwnProfile = currentUser ? currentUser.id === userId : false;

  const fetchProfileAndRelations = async () => {
    try {
      setLoadingProfile(true);
      // api.getUser now returns the full profile including `isFollowed`
      const user = await api.getUser(userId);
      setProfileUser(user);
      // If the API response includes `isFollowed`, use it. Otherwise default false.
      setIsFollowedByCurrent((user as any).isFollowed || false);
      setEditedFullName(user.fullName);
      setEditedBio(user.bio || '');
      setEditedImage(user.profileImage);
      setUploadPreview('');
      setSelectedFile(null);
    } catch (err: any) {
      showToast(err.message || 'Could not fetch profile info', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfileAndRelations();
  }, [userId, currentUser?.followingCount]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedFullName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    try {
      setUpdating(true);
      const updated = await api.updateUser(userId, {
        fullName: editedFullName.trim(),
        bio: editedBio.trim(),
        profileImage: editedImage.trim(),
      });
      setProfileUser(updated);
      onProfileUpdated(updated);
      if (currentUser && currentUser.id === userId) {
        const refreshed = await api.getUser(userId);
        onProfileUpdated(refreshed);
      }
      setIsEditing(false);
      showToast('Profile saved successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleFollowAction = async () => {
    if (!profileUser || profileUser.id === currentUser?.id) return;
    // Optimistic update
    setIsFollowedByCurrent(!isFollowedByCurrent);
    // Update the global posts state via parent
    onFollowToggle(profileUser.id);
    // Refresh profile data to get updated counts
    await fetchProfileAndRelations();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setEditedImage(base64String);
      setUploadPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const openSocialModal = async (type: 'followers' | 'following') => {
    setSocialModalType(type);
    try {
      setLoadingSocialList(true);
      const list = type === 'followers'
        ? await api.getFollowers(userId)
        : await api.getFollowing(userId);
      setSocialList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSocialList(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center animate-pulse space-y-4">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto" />
        <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto" />
        <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <p className="text-sm text-slate-500 font-semibold">User profile could not be loaded.</p>
      </div>
    );
  }

  const profilePosts = posts.filter((p) => p.authorId === userId);
  const likesCountSum = profilePosts.reduce((sum, p) => sum + p.likesCount, 0);

  return (
    <div className="space-y-6 w-full">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm relative">
        <div className="h-36 sm:h-44 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500" />
        <div className="p-6 sm:p-8 relative">
          <div className="absolute -top-16 sm:-top-20 left-6 sm:left-8">
            <img
              src={profileUser.profileImage}
              alt={profileUser.fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white shadow-md bg-white"
            />
          </div>
          <div className="flex justify-end items-center gap-3 select-none mb-6 min-h-12">
            {isOwnProfile ? (
              !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile Info</span>
                </button>
              ) : null
            ) : currentUser && (
              <button
                onClick={handleFollowAction}
                className={`flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm ${
                  isFollowedByCurrent
                    ? 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-[1.5px]'
                }`}
              >
                {isFollowedByCurrent ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow @{profileUser.username}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <h1 className="font-display font-extrabold text-[22px] tracking-tight text-slate-800 flex items-center gap-2">
                  <span>{profileUser.fullName}</span>
                  {(profileUser.username === 'sarah_j' || profileUser.username === 'marcus_code') && (
                    <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                  )}
                </h1>
                <p className="text-xs text-slate-500 font-mono">@{profileUser.username}</p>
              </div>
              <p className="text-sm text-slate-700 max-w-xl leading-relaxed whitespace-pre-wrap">
                {profileUser.bio || 'This user enjoys the simple flow of conversations and code. No bio detailed yet.'}
              </p>
              <div className="flex gap-6 pt-3 select-none text-sm">
                <button onClick={() => openSocialModal('followers')} className="flex items-center gap-1.5 hover:underline group">
                  <Users className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                  <span className="font-bold text-slate-800">{profileUser.followersCount}</span>
                  <span className="text-slate-500">followers</span>
                </button>
                <button onClick={() => openSocialModal('following')} className="flex items-center gap-1.5 hover:underline group">
                  <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                  <span className="font-bold text-slate-800">{profileUser.followingCount}</span>
                  <span className="text-slate-500">following</span>
                </button>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="font-bold text-slate-800">{likesCountSum}</span>
                  <span>likes</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h3 className="font-display font-semibold text-slate-800 text-sm">Update Personal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Display Full Name</label>
                  <input type="text" value={editedFullName} onChange={(e) => setEditedFullName(e.target.value)} className="w-full text-sm text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Avatar (URL or Upload)</label>
                  <input type="url" value={editedImage} onChange={(e) => setEditedImage(e.target.value)} placeholder="Image URL" className="w-full text-sm text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 mb-2" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-600" />
                  {uploadPreview && (<div className="mt-2"><img src={uploadPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" /></div>)}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Bio Narrative</label>
                <textarea rows={3} value={editedBio} onChange={(e) => setEditedBio(e.target.value)} placeholder="Share a short bio..." className="w-full text-sm text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={updating} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                  <Check className="w-4 h-4" />
                  <span>{updating ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Layout Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-2">
          <span>Authored Posts</span>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">{profilePosts.length}</span>
        </h2>
        <div className="flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200 p-0.5 rounded-xl">
          <button onClick={() => setLayoutView('list')} className={`p-1.5 rounded-lg transition-colors ${layoutView === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-900'}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setLayoutView('grid')} className={`p-1.5 rounded-lg transition-colors ${layoutView === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-900'}`}><Grid className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Posts Display */}
      <div>
        {loadingPosts ? (
          <p className="text-sm text-slate-500 italic text-center py-6">Loading posts archive...</p>
        ) : profilePosts.length === 0 ? (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-semibold">This profile has not authored any articles yet.</p>
          </div>
        ) : layoutView === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profilePosts.map((post) => (
              <div key={post.id} onClick={() => onPostClick(post.id)} className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all">
                <p className="text-xs text-slate-500 mb-2">{new Date(post.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-slate-700 line-clamp-3 mb-3">{post.content}</p>
                {post.imageUrl && <img src={post.imageUrl} alt="Thumbnail" className="w-full h-24 object-cover rounded-xl mb-3" />}
                <div className="flex items-center gap-3.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> {post.likesCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.commentsCount}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {profilePosts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={currentUser} onLikeToggle={onLikeToggle} onFollowToggle={onFollowToggle} onPostClick={onPostClick} onUserClick={onUserClick} onEditClick={onEditClick} onDeleteClick={onDeleteClick} />
            ))}
          </div>
        )}
      </div>

      {/* Modal for Followers / Following */}
      {socialModalType && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-tight">{socialModalType === 'followers' ? 'Followers' : 'Following List'}</h3>
              <button onClick={() => setSocialModalType(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {loadingSocialList ? <p className="text-sm text-slate-400 py-4 text-center">Loading...</p> : socialList.length === 0 ? <p className="text-sm text-slate-400 italic text-center py-6">Directory is empty.</p> : (
                <div className="space-y-3">
                  {socialList.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => { setSocialModalType(null); onUserClick(user.id); }}>
                      <div className="flex items-center gap-3">
                        <img src={user.profileImage} alt={user.fullName} className="w-9 h-9 rounded-full object-cover" />
                        <div><p className="font-semibold text-sm text-slate-800 truncate">{user.fullName}</p><p className="text-xs text-slate-400 font-mono">@{user.username}</p></div>
                      </div>
                      <span className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Browse</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}