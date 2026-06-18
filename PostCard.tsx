import { Post, User } from '../types';
import { Heart, MessageCircle } from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onLikeToggle: (postId: string) => void;
  onFollowToggle: (authorId: string) => void;
  onPostClick: (postId: string) => void;
  onUserClick: (userId: string) => void;
  onEditClick?: (post: Post) => void;
  onDeleteClick?: (postId: string) => void;
}

export default function PostCard({
  post,
  currentUser,
  onLikeToggle,
  onFollowToggle,
  onPostClick,
  onUserClick,
  onDeleteClick,
}: PostCardProps) {
  return (
    <div
      className="bg-white rounded-xl p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow border border-slate-200"
      onClick={() => onPostClick(post.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
          <img
            src={post.authorImage}
            alt={post.authorName}
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={() => onUserClick(post.authorId)}
          />
          <div>
            <div
              className="font-semibold text-slate-800 cursor-pointer"
              onClick={() => onUserClick(post.authorId)}
            >
              {post.authorName}
            </div>
            <div className="text-xs text-slate-500">
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
        {post.authorId === currentUser?.id && onDeleteClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(post.id);
            }}
            className="text-red-500 text-sm hover:text-red-700"
          >
            Delete
          </button>
        )}
        {post.authorId !== currentUser?.id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFollowToggle(post.authorId);
            }}
            className="text-xs px-3 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {post.isFollowingAuthor ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>
      <div className="mt-2 text-slate-700">{post.content}</div>
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          className="mt-3 rounded-lg max-h-80 object-cover w-full"
          alt="post visual"
        />
      )}
      <div className="flex gap-6 mt-4 text-slate-600" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onLikeToggle(post.id)}
          className={`flex items-center gap-1.5 transition-colors ${post.isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
        >
          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-rose-500' : ''}`} />
          <span className="text-sm">{post.likesCount}</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.commentsCount}</span>
        </button>
      </div>
    </div>
  );
}