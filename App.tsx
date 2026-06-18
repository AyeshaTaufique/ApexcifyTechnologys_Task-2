import React, { useState, useEffect } from 'react';
import { ActiveScreen, Post, User, ToastMessage } from './types';
import { api } from './api';

// Components
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import CreatePostModal from './components/CreatePostModal';

// Views
import AuthView from './components/views/AuthView';
import FeedView from './components/views/FeedView';
import ProfileView from './components/views/ProfileView';
import PostDetailView from './components/views/PostDetailView';
import DiscoverView from './components/views/DiscoverView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [initialLaunch, setInitialLaunch] = useState(true);

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ id: Math.random().toString(), message, type });
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) setCurrentUser(user);
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLaunch(false);
      }
    };
    checkSession();
  }, []);

  const refreshAllPosts = async () => {
    try {
      setLoadingPosts(true);
      const data = await api.getPosts();
      setPosts(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch posts', 'error');
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (currentUser) refreshAllPosts();
  }, [currentUser?.id]);

  const syncCurrentUserStats = async () => {
    if (!currentUser) return;
    try {
      const refreshed = await api.getUser(currentUser.id);
      // Important: create a new object to trigger re-render
      setCurrentUser({ ...refreshed });
    } catch (err) {
      console.error('Could not sync user stats', err);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    try {
      if (post.isLiked) {
        const result = await api.unlikePost(postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: false, likesCount: result.likesCount } : p));
      } else {
        const result = await api.likePost(postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: true, likesCount: result.likesCount } : p));
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ***** FIXED FOLLOW TOGGLE *****
  const handleFollowToggle = async (authorId: string) => {
    if (!currentUser) return;

    const targetPost = posts.find(p => p.authorId === authorId);
    const currentlyFollowing = targetPost ? targetPost.isFollowingAuthor : false;

    // Optimistic update
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.authorId === authorId ? { ...p, isFollowingAuthor: !currentlyFollowing } : p
      )
    );

    try {
      if (currentlyFollowing) {
        await api.unfollowUser(authorId);
        showToast(`Unfollowed`, 'success');
      } else {
        await api.followUser(authorId);
        showToast(`Now following`, 'success');
      }
      // Refresh posts
      await refreshAllPosts();
      // 🔥 CRITICAL: Refresh current user to get updated followers/following counts
      const refreshedUser = await api.getUser(currentUser.id);
      setCurrentUser(refreshedUser);
    } catch (err: any) {
      // Rollback optimistic update
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.authorId === authorId ? { ...p, isFollowingAuthor: currentlyFollowing } : p
        )
      );
      showToast(err.message || 'Follow action failed', 'error');
    }
  };

  const handleCreateOrEditPost = async (content: string, imageUrl?: string) => {
    try {
      if (editingPost) {
        await api.updatePost(editingPost.id, content, imageUrl);
        showToast('Post updated', 'success');
        setEditingPost(null);
      } else {
        await api.createPost(content, imageUrl);
        showToast('Post published', 'success');
      }
      refreshAllPosts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete permanently?')) return;
    try {
      await api.deletePost(postId);
      showToast('Post deleted', 'success');
      if (activeScreen === 'post-detail' && selectedPostId === postId) {
        setActiveScreen('feed');
        setSelectedPostId(null);
      }
      refreshAllPosts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setActiveScreen('feed');
    setSelectedUserId(null);
    setSelectedPostId(null);
    showToast('Logged out', 'success');
  };

  const navigateToProfile = (userId: string) => {
    setSelectedUserId(userId);
    setActiveScreen('profile');
    window.scrollTo(0, 0);
  };

  const navigateToPostDetail = (postId: string) => {
    setSelectedPostId(postId);
    setActiveScreen('post-detail');
    window.scrollTo(0, 0);
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'profile':
        return (
          <ProfileView
            userId={selectedUserId || currentUser?.id || ''}
            currentUser={currentUser}
            posts={posts}
            loadingPosts={loadingPosts}
            onLikeToggle={handleLikeToggle}
            onFollowToggle={handleFollowToggle}
            onPostClick={navigateToPostDetail}
            onUserClick={navigateToProfile}
            onEditClick={(post) => { setEditingPost(post); setIsCreatePostOpen(true); }}
            onDeleteClick={handleDeletePost}
            onProfileUpdated={(updated) => { setCurrentUser(updated); if (selectedUserId === updated.id) setSelectedUserId(updated.id); }}
            showToast={showToast}
          />
        );
      case 'post-detail':
        return (
          <PostDetailView
            postId={selectedPostId || ''}
            currentUser={currentUser}
            onBack={() => { setActiveScreen('feed'); setSelectedPostId(null); }}
            onLikeToggle={handleLikeToggle}
            onUserClick={navigateToProfile}
            showToast={showToast}
          />
        );
      case 'discover':
        return (
          <DiscoverView
            currentUser={currentUser}
            onUserClick={navigateToProfile}
            onFollowToggle={handleFollowToggle}
            showToast={showToast}
            posts={posts}
          />
        );
      default:
        return (
          <FeedView
            currentUser={currentUser}
            posts={posts}
            loading={loadingPosts}
            onLikeToggle={handleLikeToggle}
            onFollowToggle={handleFollowToggle}
            onPostClick={navigateToPostDetail}
            onUserClick={navigateToProfile}
            onEditClick={(post) => { setEditingPost(post); setIsCreatePostOpen(true); }}
            onDeleteClick={handleDeletePost}
            onCreatePostSubmit={handleCreateOrEditPost}
            onRefreshFeed={refreshAllPosts}
          />
        );
    }
  };

  if (initialLaunch) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  if (!currentUser) {
    return (
      <>

        <AuthView
          onAuthSuccess={async (user) => {
            const fullUser = await api.getUser(user.id);
            setCurrentUser(fullUser);
            setActiveScreen('feed');
          }}
          showToast={showToast}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Navigation
        activeScreen={activeScreen}
        setActiveScreen={(screen) => { setActiveScreen(screen); if (screen === 'profile') setSelectedUserId(currentUser.id); window.scrollTo(0, 0); }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenCreatePost={() => { setEditingPost(null); setIsCreatePostOpen(true); }}
      />
      <main className="flex-1 flex justify-center p-4 sm:p-6 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-2xl w-full flex flex-col gap-6">
          {renderActiveScreen()}
        </div>
      </main>
      <div className="hidden lg:block p-6 border-l border-slate-200 bg-slate-50">
        <Sidebar currentUser={currentUser} onUserClick={navigateToProfile} onRefreshFeed={refreshAllPosts} showToast={showToast} posts={posts} />
      </div>
      <CreatePostModal isOpen={isCreatePostOpen} onClose={() => { setIsCreatePostOpen(false); setEditingPost(null); }} onSubmit={handleCreateOrEditPost} editingPost={editingPost} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}