import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePollStore } from '../store/pollStore';
import { PollType } from '../types';

const pollTypeLabels: Record<PollType, string> = {
  [PollType.SINGLE_CHOICE]: '单选',
  [PollType.MULTIPLE_CHOICE]: '多选',
  [PollType.RANKING]: '排序',
  [PollType.RATING]: '评分',
  [PollType.WEIGHTED]: '加权',
};

export default function Templates() {
  const navigate = useNavigate();
  const { templates, fetchTemplates, createPoll } = usePollStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const useTemplate = async (template: any) => {
    const poll = await createPoll({
      title: `${template.name}（副本）`,
      description: template.description,
      type: template.type,
      isAnonymous: template.isAnonymous,
      isPublic: template.isPublic,
      maxVotesPerUser: 1,
      options: template.defaultOptions.map((name: string) => ({ name, description: '' })),
    });
    navigate(`/poll/${poll.id}`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">投票模板</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
              <p className="text-gray-600 text-sm">{template.description}</p>
            </div>
            <div className="mb-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {pollTypeLabels[template.type]}
              </span>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">默认选项：</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {template.defaultOptions.map((opt, i) => (
                  <li key={i}>• {opt}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => useTemplate(template)}
              className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              使用模板
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
