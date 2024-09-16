'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptData {
  merchant: string;
  date: string;
  totalAmount: number;
  items: ReceiptItem[];
}

export default function ReceiptForm() {
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    merchant: '',
    date: '',
    totalAmount: 0,
    items: [{ name: '', quantity: 1, price: 0 }]
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'review' | 'edit'>('upload');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const performOCR = async (file: File) => {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(file);
    await worker.terminate();
    return ret.data.text;
  };

  const analyzeWithAI = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-receipt', {
        body: { text },
      });
  
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
  
      return data;
    } catch (error) {
      console.error('Error invoking Supabase function:', error);
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImage(file);
      setLoading(true);
      try {
        const text = await performOCR(file);
        const analysisResult = await analyzeWithAI(text);
        setReceiptData(analysisResult);
        setStep('review');
      } catch (error) {
        console.error('Processing Error:', error);
        alert('Error processing image');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const newItems = [...receiptData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setReceiptData({ ...receiptData, items: newItems });
  };

  const addItem = () => {
    setReceiptData({
      ...receiptData,
      items: [...receiptData.items, { name: '', quantity: 1, price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = receiptData.items.filter((_, i) => i !== index);
    setReceiptData({ ...receiptData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('receipts')
        .insert([
          {
            merchant: receiptData.merchant,
            date: receiptData.date || null,
            total_amount: receiptData.totalAmount,
            items: JSON.stringify(receiptData.items),
            user_id: (await supabase.auth.getUser()).data.user?.id
          }
        ]);

      if (error) throw error;

      if (image) {
        const { data: imageData, error: imageError } = await supabase
          .storage
          .from('receipt_images')
          .upload(`${Date.now()}_${image.name}`, image);

        if (imageError) throw imageError;
      }

      alert('Receipt added successfully');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error adding receipt:', error);
      alert('Failed to add receipt');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Upload Receipt</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={loading}
        />
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review Extracted Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Merchant</Label>
            <p>{receiptData.merchant}</p>
          </div>
          <div>
            <Label>Date</Label>
            <p>{receiptData.date}</p>
          </div>
          <div>
            <Label>Total Amount</Label>
            <p>${receiptData.totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <Label>Items</Label>
            <ul className="list-disc pl-5">
              {receiptData.items.map((item, index) => (
                <li key={index}>
                  {item.name} - Quantity: {item.quantity}, Price: ${item.price.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 space-x-2">
          <Button onClick={() => setStep('edit')}>Edit</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderEditStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Edit Receipt Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="merchant">Merchant</Label>
            <Input
              id="merchant"
              value={receiptData.merchant}
              onChange={(e) => setReceiptData({ ...receiptData, merchant: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={receiptData.date}
              onChange={(e) => setReceiptData({ ...receiptData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="totalAmount">Total Amount</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              value={receiptData.totalAmount}
              onChange={(e) => setReceiptData({ ...receiptData, totalAmount: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label>Items</Label>
            {receiptData.items.map((item, index) => (
              <div key={index} className="flex space-x-2 mt-2">
                <Input
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  required
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  required
                  min="1"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                  required
                  step="0.01"
                />
                <Button type="button" onClick={() => removeItem(index)} variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addItem} className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      {step === 'upload' && renderUploadStep()}
      {step === 'review' && renderReviewStep()}
      {step === 'edit' && renderEditStep()}
    </div>
  );
}