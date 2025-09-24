'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

interface MarkdownEditorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label?: string;
}

export function MarkdownEditor({ value, onChange, label, className, ...props }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={cn('grid w-full gap-1.5', className)}>
      {label && <Label htmlFor={props.id || 'markdown-editor'}>{label}</Label>}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant={!showPreview ? 'secondary' : 'ghost'}
          onClick={() => setShowPreview(false)}
        >
          Write
        </Button>
        <Button
          type="button"
          variant={showPreview ? 'secondary' : 'ghost'}
          onClick={() => setShowPreview(true)}
        >
          Preview
        </Button>
      </div>
      {!showPreview ? (
        <Textarea
          id={props.id || 'markdown-editor'}
          placeholder="Type your markdown here."
          value={value}
          onChange={onChange}
          className="min-h-[200px]"
          {...props}
        />
      ) : (
        <div className="prose dark:prose-invert min-h-[200px] p-2 border rounded-md">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
