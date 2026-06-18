export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  profileImage: string;
  bio: string;
  followersCount: number;
  followingCount: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  // Dynamic client-side fields (mock database-derived per currently-logged-in-user relation)
  isLiked: boolean;
  isFollowingAuthor: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userImage: string;
  text: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type ActiveScreen = 'feed' | 'profile' | 'post-detail' | 'discover';
