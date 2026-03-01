import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://bolls.life/get-text/NIV/1/1/');
    const data = await res.json();
    // Return first 3 verses with raw HTML
    const sample = data.slice(0, 3).map((v: { verse: number; text: string }) => ({
      verse: v.verse,
      rawHtml: v.text,
    }));
    return NextResponse.json(sample);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
