import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePollStore } from '../store/pollStore';
import { PollType, PollStatus } from '../types';

const pollTypeLabels: Record<PollType, string> = {
  [PollType.SINGLE_CHOICE]: '单选',
  [PollType.MULTIPLE_CHOICE]: '多选',
  [PollType.RANKING]: '排序',
  [PollType.RATING]: '评分',
  [PollType.WEIGHTED]: '加权',
};

const statusColors: Record<PollStatus, string> = {
  [PollStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [PollStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [PollStatus.ENDED]: 'bg-yellow-100 text-yellow-800',
  [PollStatus.ARCHIVED]: 'bg-red-100 text-red-800',
};

const statusLabels: Record<PollStatus, string> = {
  [PollStatus.DRAFT]: '草稿',
  [PollStatus.ACTIVE]: '进行中',
  [PollStatus.ENDED]: '已结束',
  [PollStatus.ARCHIVED]: '已归档',
};

export default function PollList() {
  const { polls, loading, fetchPolls } = usePollStore();

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">投票列表</h1>
      {polls.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无投票</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <Link
              key={poll.id}
              to={`/poll/${poll.id}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{poll.title}</h3>
                <span className={`px-2 py-1 rounded text-sm ${statusColors[poll.status]}`}>
                  {statusLabels[poll.status]}
                </span>
              </div>
              {poll.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{poll.description}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {pollTypeLabels[poll.type]}
                </span>
                <span>{poll.options.length} 个选项</span>
              </div>
              <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                创建者：{poll.creator.name}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
