import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { imageUrl } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase.functions.invoke('process-receipt', {
      body: JSON.stringify({ imageUrl }),
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 });
  }
}