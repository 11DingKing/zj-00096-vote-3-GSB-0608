import { useState, useEffect } from 'react';
import { commentsApi } from '../services/api';
import { Comment } from '../types';
import { useAuthStore } from '../store/authStore';

interface CommentSectionProps {
  pollId: number;
}

export default function CommentSection({ pollId }: CommentSectionProps) {
  const { isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentsApi.getByPollId(pollId, page);
      setComments(response.data.comments);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [pollId, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      await commentsApi.create(pollId, newComment.trim());
      setNewComment('');
      setPage(1);
      fetchComments();
    } catch (error) {
      console.error('发表评论失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    try {
      await commentsApi.like(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likeCount: c.likeCount + 1 } : c
        )
      );
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-6">评论区</h2>

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="发表您的评论..."
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">{newComment.length}/500</span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '发表中...' : '发表评论'}
            </button>
          </div>
        </form>
      )}

      {!isAuthenticated && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
          请登录后发表评论
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : (
        <>
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无评论</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-800">
                      {comment.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{comment.content}</p>
                  <button
                    onClick={() => handleLike(comment.id)}
                    className="flex items-center text-sm text-gray-500 hover:text-blue-500"
                  >
                    <span className="mr-1">👍</span>
                    <span>{comment.likeCount}</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
