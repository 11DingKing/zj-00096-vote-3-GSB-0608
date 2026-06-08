import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PollResults, PollType } from '../types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface ResultsChartProps {
  results: PollResults;
}

export default function ResultsChart({ results }: ResultsChartProps) {
  const data = results.results.map((item) => ({
    name: item.optionName,
    value: item.count,
    percentage: item.percentage,
    weightedScore: item.weightedScore,
    avgRating: item.avgRating,
    bordaScore: item.bordaScore,
    rank: item.rank,
  }));

  if (results.pollType === PollType.SINGLE_CHOICE) {
    return (
      <div>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-6">
          <h3 className="font-bold mb-4">排名</h3>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                <span className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full mr-4">
                  {item.rank}
                </span>
                <span className="flex-1">{item.name}</span>
                <span className="font-semibold">{item.value} 票 ({item.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results.pollType === PollType.MULTIPLE_CHOICE) {
    return (
      <div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="票数" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6">
          <h3 className="font-bold mb-4">排名</h3>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                <span className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full mr-4">
                  {item.rank}
                </span>
                <span className="flex-1">{item.name}</span>
                <span className="font-semibold">{item.value} 票</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results.pollType === PollType.RANKING) {
    return (
      <div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="bordaScore" name="Borda 分数" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6">
          <h3 className="font-bold mb-4">排名（Borda 计分法）</h3>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                <span className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full mr-4">
                  {item.rank}
                </span>
                <span className="flex-1">{item.name}</span>
                <span className="font-semibold">{item.bordaScore} 分</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results.pollType === PollType.RATING) {
    return (
      <div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgRating" name="平均分" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6">
          <h3 className="font-bold mb-4">平均分排名</h3>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                <span className="w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-full mr-4">
                  {item.rank}
                </span>
                <span className="flex-1">{item.name}</span>
                <span className="font-semibold">{item.avgRating?.toFixed(2)} / 10 分</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results.pollType === PollType.WEIGHTED) {
    return (
      <div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="weightedScore" name="加权得分" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6">
          <h3 className="font-bold mb-4">加权得分排名</h3>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                <span className="w-8 h-8 flex items-center justify-center bg-purple-500 text-white rounded-full mr-4">
                  {item.rank}
                </span>
                <span className="flex-1">{item.name}</span>
                <span className="font-semibold">{item.weightedScore} 分</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
