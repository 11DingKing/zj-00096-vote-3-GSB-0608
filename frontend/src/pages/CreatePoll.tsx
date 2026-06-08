import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePollStore } from '../store/pollStore';
import { PollType } from '../types';

const pollTypeOptions = [
  { value: PollType.SINGLE_CHOICE, label: '单选投票' },
  { value: PollType.MULTIPLE_CHOICE, label: '多选投票' },
  { value: PollType.RANKING, label: '排序投票' },
  { value: PollType.RATING, label: '评分投票' },
  { value: PollType.WEIGHTED, label: '加权投票' },
];

export default function CreatePoll() {
  const navigate = useNavigate();
  const { createPoll } = usePollStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PollType>(PollType.SINGLE_CHOICE);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [options, setOptions] = useState([{ name: '', description: '' }]);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    setOptions([...options, { name: '', description: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: 'name' | 'description', value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validOptions = options.filter((opt) => opt.name.trim());
    if (validOptions.length < 2) {
      setError('请至少输入2个选项');
      return;
    }

    try {
      const poll = await createPoll({
        title,
        description,
        type,
        isAnonymous,
        isPublic,
        maxVotesPerUser: type === PollType.MULTIPLE_CHOICE ? validOptions.length : 1,
        options: validOptions,
      });
      navigate(`/poll/${poll.id}`);
    } catch (error: any) {
      setError(error.response?.data?.message || '创建失败');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">创建投票</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">投票标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">投票类型 *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PollType)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pollTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">投票选项 *</label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => updateOption(index, 'name', e.target.value)}
                      placeholder={`选项 ${index + 1}`}
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
                    />
                    <input
                      type="text"
                      value={option.description}
                      onChange={(e) => updateOption(index, 'description', e.target.value)}
                      placeholder="描述（可选）"
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-3 text-blue-500 hover:text-blue-600"
            >
              + 添加选项
            </button>
          </div>

          <div className="mb-6 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 mr-3"
              />
              <span className="text-gray-700">匿名投票</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 mr-3"
              />
              <span className="text-gray-700">公开结果</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            创建投票
          </button>
        </form>
      </div>
    </div>
  );
}
