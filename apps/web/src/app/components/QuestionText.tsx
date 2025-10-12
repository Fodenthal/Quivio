'use client';

import type { QuestionContentFormat } from '@shared/index';
import type { ElementType, ReactNode } from 'react';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

type WrapperComponent = ElementType<{ className?: string; children?: ReactNode }>;

interface QuestionTextProps {
  text?: string | null;
  format?: QuestionContentFormat | string | null;
  className?: string;
  as?: WrapperComponent;
}

const normalizeFormat = (format: QuestionTextProps['format']): QuestionContentFormat => {
  if (typeof format === 'string') {
    const normalized = format.trim().toLowerCase();
    if (normalized === 'latex') {
      return 'latex';
    }
  }
  return 'plain';
};

const QuestionText = memo(function QuestionText({
  text,
  format,
  className,
  as: Component = 'div',
}: QuestionTextProps) {
  if (!text) {
    return null;
  }

  const resolvedFormat = normalizeFormat(format);
  const Wrapper = Component as WrapperComponent;

  if (resolvedFormat === 'latex') {
    return (
      <Wrapper className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            // Unwrap paragraph to prevent extra spacing, but let other elements render normally
            p: (props) => <span {...props} />,
          }}
        >
          {text}
        </ReactMarkdown>
      </Wrapper>
    );
  }

  return <Wrapper className={className}>{text}</Wrapper>;
});

export default QuestionText;
