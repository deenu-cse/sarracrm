import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatCard({ title, value, icon: Icon, color = 'navy', trend, trendValue }) {
  const colorMap = {
    navy: 'border-l-navy text-navy',
    success: 'border-l-success text-success',
    warning: 'border-l-warning text-warning',
    danger: 'border-l-danger text-danger',
    saffron: 'border-l-saffron text-saffron'
  };

  const bgIconMap = {
    navy: 'bg-blue-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50',
    saffron: 'bg-orange-50'
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 p-5 flex flex-col justify-between ${colorMap[color].split(' ')[0]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${bgIconMap[color]}`}>
          <Icon className={`w-5 h-5 ${colorMap[color].split(' ')[1]}`} />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
          {trend === 'neutral' && <Minus className="w-4 h-4 text-slate-400 mr-1" />}
          
          <span className={`font-medium mr-1 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            {trendValue}
          </span>
          <span className="text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
}
