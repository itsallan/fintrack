import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  date: string;
  amount: number;
}

interface DynamicRechartsProps {
  data: ChartData[];
}

const DynamicRecharts: React.FC<DynamicRechartsProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="amount" fill="#4F46E5" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DynamicRecharts;