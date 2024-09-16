'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";

const DynamicRecharts = dynamic(() => import('./DynamicRecharts'), { ssr: false });

interface Receipt {
  id: string;
  merchant: string;
  date: string;
  total_amount: number;
}

interface ChartDataPoint {
  date: string;
  amount: number;
}

const Dashboard: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Calculate total spent
  const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.total_amount, 0);

  // Calculate average spent
  const averageSpent = receipts.length > 0 ? totalSpent / receipts.length : 0;

  const chartData: ChartDataPoint[] = receipts
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(receipt => ({
      date: new Date(receipt.date).toLocaleDateString(),
      amount: receipt.total_amount
    }));

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Financial Dashboard</h1>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/add-receipt">Add Receipt</Link>
          </Button>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Spent</h3>
          <p className="text-3xl font-bold text-indigo-600">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Average Spent</h3>
          <p className="text-3xl font-bold text-indigo-600">${averageSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Receipts</h3>
          <p className="text-3xl font-bold text-indigo-600">{receipts.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending Over Time</h3>
        <div style={{ width: '100%', height: 300 }}>
          <DynamicRecharts data={chartData} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Receipts</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receipts.slice(0, 5).map((receipt) => (
                <tr key={receipt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(receipt.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{receipt.merchant}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${receipt.total_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;