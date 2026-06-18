import { useState, useEffect } from 'react';
import { Comment, User } from '../types';
import { api } from '../api';

interface CommentBoxProps {
  postId: string;
  currentUser: User | null;
  onCommentsUpdated: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CommentBox({
  postId,
  currentUser,
  onCommentsUpdated,
  showToast,
}: CommentBoxProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await api.getComments(postId);
      setComments(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await api.createComment(postId, newComment);
      setNewComment('');
      await fetchComments();
      onCommentsUpdated(); // refresh post metadata
      showToast('Comment posted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.deleteComment(commentId);
      await fetchComments();
      onCommentsUpdated();
      showToast('Comment deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  if (loading && comments.length === 0) {
    return <div className="text-sm text-slate-500 py-4">Loading comments...</div>;
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <h4 className="font-semibold text-slate-800 mb-3">Comments ({comments.length})</h4>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex justify-between items-start">
              <div className="flex gap-2 items-center">
                <img
                  src={c.userImage}
                  className="w-6 h-6 rounded-full object-cover"
                  alt={c.username}
                />
                <span className="font-semibold text-sm text-slate-800">{c.username}</span>
              </div>
              {currentUser && c.userId === currentUser.id && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="text-red-500 text-xs hover:text-red-700"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-sm text-slate-700 mt-1">{c.text}</p>
            <span className="text-xs text-slate-400 block mt-1">
              {new Date(c.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
        {comments.length === 0 && !loading && (
          <p className="text-sm text-slate-400 text-center py-4">No comments yet. Be the first!</p>
        )}
      </div>
      {currentUser && (
        <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 px-4 py-2 rounded-full text-sm text-white font-medium transition"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      )}
    </div>
  );
}