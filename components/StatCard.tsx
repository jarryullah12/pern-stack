
import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { StatData } from '../types';

interface StatCardProps {
  data: StatData;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ data, icon: Icon, iconBg = "bg-blue-50", iconColor = "text-blue-600" }) => {
  const renderTrend = () => {
    if (!data.change) return null;
    const isUp = data.trend === 'up';
    const isDown = data.trend === 'down';
    
    return (
      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        isUp ? 'text-green-600 bg-green-50' : 
        isDown ? 'text-red-600 bg-red-50' : 
        'text-gray-600 bg-gray-50'
      }`}>
        {isUp && <TrendingUp size={14} />}
        {isDown && <TrendingDown size={14} />}
        {!isUp && !isDown && <Minus size={14} />}
        {data.change} from last month
      </span>
    );
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-gray-500">{data.label}</p>
        <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} transition-transform group-hover:scale-110 flex items-center justify-center`}>
          {Icon ? <Icon size={20} /> : <div className="w-5 h-5 flex items-center justify-center font-bold">●</div>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-gray-900">{data.value}</h3>
        {data.subtext && <p className="text-sm text-gray-400 font-normal">{data.subtext}</p>}
        <div className="mt-1">
          {renderTrend()}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
