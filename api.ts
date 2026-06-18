import { User, Post, Comment } from './types';

const API_BASE = 'http://localhost:5000/api';

let authToken: string | null = localStorage.getItem('social_platform_auth_token');

const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'API request failed');
  }
  return response.json();
};

function setToken(token: string, user: User) {
  authToken = token;
  localStorage.setItem('social_platform_auth_token', token);
  localStorage.setItem('social_platform_current_user_id', user.id);
}

export const api = {
  // ==================== AUTH ====================
  async register(username: string, fullName: string, email: string, password?: string): Promise<{ token: string; user: User }> {
    const data = await apiCall<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, fullName }),
    });
    const user = { ...data.user, profileImage: data.user.profileImage || data.user.avatar };
    setToken(data.token, user);
    return { token: data.token, user };
  },

  async login(usernameOrEmail: string, password?: string): Promise<{ token: string; user: User }> {
    const data = await apiCall<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: usernameOrEmail, password }),
    });
    const user = { ...data.user, profileImage: data.user.profileImage || data.user.avatar };
    setToken(data.token, user);
    return { token: data.token, user };
  },

  async logout(): Promise<{ success: boolean }> {
    localStorage.removeItem('social_platform_auth_token');
    localStorage.removeItem('social_platform_current_user_id');
    authToken = null;
    return { success: true };
  },

  async getCurrentUser(): Promise<User | null> {
    const userId = localStorage.getItem('social_platform_current_user_id');
    if (!userId || !authToken) return null;
    try {
      return await this.getUser(userId);
    } catch { return null; }
  },

  // ==================== USERS ====================
  async getUser(id: string): Promise<User> {
    const data = await apiCall<{ user: any; followers: number; following: number }>(`/users/profile/${id}`);
    return {
      ...data.user,
      followersCount: data.followers,
      followingCount: data.following,
      profileImage: data.user.profileImage || data.user.avatar,
    };
  },

  async updateUser(id: string, updates: Partial<Pick<User, 'fullName' | 'bio' | 'profileImage' | 'email'>>): Promise<User> {
    await apiCall<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName: updates.fullName, bio: updates.bio, profileImage: updates.profileImage }),
    });
    return this.getUser(id);
  },

  async searchUsers(query: string): Promise<User[]> {
    const users = await apiCall<any[]>(`/users/search?q=${encodeURIComponent(query)}`);
    return users.map(u => ({ ...u, profileImage: u.profileImage || u.avatar }));
  },

  async getFollowers(userId: string): Promise<User[]> {
    const users = await apiCall<any[]>(`/users/${userId}/followers`);
    return users.map(u => ({ ...u, profileImage: u.profileImage || u.avatar }));
  },

  async getFollowing(userId: string): Promise<User[]> {
    const users = await apiCall<any[]>(`/users/${userId}/following`);
    return users.map(u => ({ ...u, profileImage: u.profileImage || u.avatar }));
  },

  // ==================== POSTS ====================
  async getPosts(filterFollowingOnly = false): Promise<Post[]> {
    const mode = filterFollowingOnly ? 'following' : 'global';
    return apiCall<Post[]>(`/posts?mode=${mode}`);
  },

  async getPost(id: string): Promise<Post> {
    const posts = await this.getPosts(false);
    const post = posts.find(p => p.id === id);
    if (!post) throw new Error('Post not found');
    return post;
  },

  async createPost(content: string, imageUrl?: string): Promise<Post> {
    const data = await apiCall<{ id: string }>('/posts', { method: 'POST', body: JSON.stringify({ content, imageUrl }) });
    const posts = await this.getPosts(false);
    const newPost = posts.find(p => p.id === data.id);
    if (!newPost) throw new Error('Failed to retrieve created post');
    return newPost;
  },

  async updatePost(id: string, content: string, imageUrl?: string): Promise<Post> {
    // Optional: implement if needed
    throw new Error('Update endpoint not implemented');
  },

  async deletePost(id: string): Promise<{ success: boolean }> {
    return apiCall(`/posts/${id}`, { method: 'DELETE' });
  },

  // ==================== LIKES ====================
  async likePost(postId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    return apiCall(`/posts/${postId}/like`, { method: 'POST' });
  },
  async unlikePost(postId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    return apiCall(`/posts/${postId}/like`, { method: 'DELETE' });
  },

  // ==================== COMMENTS ====================
  async getComments(postId: string): Promise<Comment[]> {
    return apiCall(`/comments/post/${postId}`);
  },
  async createComment(postId: string, text: string): Promise<Comment> {
    return apiCall(`/comments/post/${postId}`, { method: 'POST', body: JSON.stringify({ content: text }) });
  },
  async deleteComment(id: string): Promise<{ success: boolean; postId: string }> {
    return apiCall(`/comments/${id}`, { method: 'DELETE' });
  },

  // ==================== FOLLOWS ====================
  async followUser(targetUserId: string): Promise<{ followersCount: number; isFollowing: boolean }> {
    return apiCall(`/follows/${targetUserId}`, { method: 'POST' });
  },
  async unfollowUser(targetUserId: string): Promise<{ followersCount: number; isFollowing: boolean }> {
    return apiCall(`/follows/${targetUserId}`, { method: 'DELETE' });
  },
};