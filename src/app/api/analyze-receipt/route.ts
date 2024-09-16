// src/app/api/analyze-receipt/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI specialized in analyzing receipt texts. Extract the following information: merchant name, date, total amount, and a list of items with their quantities and prices. Format your response as JSON."
        },
        {
          role: "user",
          content: `Analyze this receipt text and extract the required information: ${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze receipt' }, { status: 500 });
  }
}