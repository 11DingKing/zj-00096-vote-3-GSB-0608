import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePollStore } from '../store/pollStore';
import { useAuthStore } from '../store/authStore';
import { PollType, Role, PollStatus } from '../types';
import ResultsChart from '../components/ResultsChart';
import CommentSection from '../components/CommentSection';

export default function PollDetail() {
  const { id } = useParams<{ id: string }>();
  const pollId = parseInt(id || '0');
  const { currentPoll, results, hasVoted, loading, fetchPoll, fetchResults, checkHasVoted, vote, exportResults } = usePollStore();
  const { user, hasRole } = useAuthStore();
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [rankings, setRankings] = useState<Record<number, number>>({});
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    fetchPoll(pollId);
    fetchResults(pollId);
    checkHasVoted(pollId);

    const broadcastChannel = new BroadcastChannel(`poll-${pollId}-updates`);
    broadcastChannel.onmessage = () => {
      fetchResults(pollId);
    };

    return () => broadcastChannel.close();
  }, [pollId, fetchPoll, fetchResults, checkHasVoted]);

  const handleSingleChoice = (optionId: number) => {
    setSelectedOptions([optionId]);
  };

  const handleMultipleChoice = (optionId: number) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  const handleRanking = (optionId: number, rank: number) => {
    setRankings((prev) => ({ ...prev, [optionId]: rank }));
  };

  const handleRating = (optionId: number, rating: number) => {
    setRatings((prev) => ({ ...prev, [optionId]: rating }));
  };

  const handleVote = async () => {
    setVoteError(null);
    try {
      let votes: any[] = [];

      if (currentPoll?.type === PollType.SINGLE_CHOICE || currentPoll?.type === PollType.WEIGHTED) {
        if (selectedOptions.length === 0) {
          setVoteError('请选择一个选项');
          return;
        }
        votes = selectedOptions.map((optionId) => ({ optionId }));
      } else if (currentPoll?.type === PollType.MULTIPLE_CHOICE) {
        if (selectedOptions.length === 0) {
          setVoteError('请至少选择一个选项');
          return;
        }
        votes = selectedOptions.map((optionId) => ({ optionId }));
      } else if (currentPoll?.type === PollType.RANKING) {
        const allRanked = currentPoll.options.every((opt) => rankings[opt.id]);
        if (!allRanked) {
          setVoteError('请为所有选项排序');
          return;
        }
        votes = Object.entries(rankings).map(([optionId, rankValue]) => ({
          optionId: parseInt(optionId),
          rankValue,
        }));
      } else if (currentPoll?.type === PollType.RATING) {
        const allRated = currentPoll.options.every((opt) => ratings[opt.id]);
        if (!allRated) {
          setVoteError('请为所有选项评分');
          return;
        }
        votes = Object.entries(ratings).map(([optionId, ratingValue]) => ({
          optionId: parseInt(optionId),
          ratingValue,
        }));
      }

      await vote(pollId, { votes });

      const broadcastChannel = new BroadcastChannel(`poll-${pollId}-updates`);
      broadcastChannel.postMessage({ type: 'VOTE_CAST' });
      broadcastChannel.close();
    } catch (error: any) {
      setVoteError(error.response?.data?.message || '投票失败');
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (!currentPoll) {
    return <div className="text-center py-8">投票不存在</div>;
  }

  const canVote = currentPoll.status === PollStatus.ACTIVE && !hasVoted;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{currentPoll.title}</h1>
            <p className="text-gray-600">{currentPoll.description}</p>
          </div>
          <div className="flex gap-2">
            {!currentPoll.isPublic && !user && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                需登录查看结果
              </span>
            )}
            {hasVoted && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                您已投票
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-6 text-sm text-gray-500">
          <span>创建者：{currentPoll.creator.name}</span>
          <span>匿名投票：{currentPoll.isAnonymous ? '是' : '否'}</span>
        </div>

        {voteError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{voteError}</div>
        )}

        {canVote ? (
          <>
            <div className="space-y-4">
              {currentPoll.options.map((option) => (
                <div key={option.id} className="p-4 border rounded-lg hover:border-blue-300">
                  <div className="flex items-center">
                    {currentPoll.type === PollType.SINGLE_CHOICE && (
                      <input
                        type="radio"
                        name="option"
                        checked={selectedOptions.includes(option.id)}
                        onChange={() => handleSingleChoice(option.id)}
                        className="w-5 h-5 mr-3"
                      />
                    )}
                    {(currentPoll.type === PollType.MULTIPLE_CHOICE ||
                      currentPoll.type === PollType.WEIGHTED) && (
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(option.id)}
                        onChange={() => handleMultipleChoice(option.id)}
                        className="w-5 h-5 mr-3"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{option.name}</h4>
                      {option.description && (
                        <p className="text-sm text-gray-600">{option.description}</p>
                      )}
                    </div>
                    {currentPoll.type === PollType.RANKING && (
                      <div className="ml-4">
                        <select
                          value={rankings[option.id] || ''}
                          onChange={(e) => handleRanking(option.id, parseInt(e.target.value))}
                          className="px-3 py-1 border rounded"
                        >
                          <option value="">排名</option>
                          {currentPoll.options.map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              第{i + 1}名
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {currentPoll.type === PollType.RATING && (
                      <div className="ml-4 flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleRating(option.id, score)}
                            className={`w-8 h-8 rounded ${
                              ratings[option.id] === score
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleVote}
              className="mt-6 w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              提交投票
            </button>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {hasVoted ? '感谢您的投票！' : '该投票已结束或尚未开始。'}
          </div>
        )}
      </div>

      {(currentPoll.isPublic || user) && results && (
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">投票结果</h2>
            {hasRole(Role.ADMIN, Role.CREATOR) && (
              <div className="flex gap-2">
                <button
                  onClick={() => exportResults(pollId, false)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  导出汇总
                </button>
                <button
                  onClick={() => exportResults(pollId, true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  导出明细
                </button>
              </div>
            )}
          </div>
          <ResultsChart results={results} />
        </div>
      )}

      <CommentSection pollId={pollId} />
    </div>
  );
}
