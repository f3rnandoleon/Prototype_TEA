import React from 'react';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { ChildModel } from '@/models/Child';

interface ChildLayoutProps {
  children: React.ReactNode;
  params: {
    childId: string;
  };
}

export default async function ChildLayout({ children, params }: ChildLayoutProps) {
  await connectDB();
  const child = await ChildModel.findById(params.childId).lean();

  if (!child) {
    notFound();
  }

  const contrastClass =
    child.accessibility?.contrast === 'high'
      ? 'high-contrast'
      : child.accessibility?.contrast === 'soft'
      ? 'calm-mode'
      : '';

  return (
    <div
      className={`min-h-screen bg-slate-100 flex flex-col font-sans select-none ${contrastClass}`}
    >
      {children}
    </div>
  );
}
