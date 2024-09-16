'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Receipt = {
  id: number;
  merchant: string;
  amount: number;
  date: string;
  description: string;
};

export default function ReceiptList() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchReceipts = async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching receipts:', error);
      } else {
        setReceipts(data);
      }
    };

    fetchReceipts();
  }, [supabase]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Receipts</h2>
      <ul className="space-y-4">
        {receipts.map((receipt) => (
          <li key={receipt.id} className="border p-4 rounded-md">
            <h3 className="font-bold">{receipt.merchant}</h3>
            <p>Amount: ${receipt.amount.toFixed(2)}</p>
            <p>Date: {new Date(receipt.date).toLocaleDateString()}</p>
            <p>{receipt.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}