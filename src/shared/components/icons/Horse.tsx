import type { SVGProps } from 'react';

export function Horse({ className, ...props }: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 21V14l-2-2 2-3h3l3 2h4l4-3 2 2-1 3-3 2v6" />
      <path d="M11 13v3" />
      <path d="M16 9l1-3" />
      <circle cx="17.5" cy="6" r="0.6" fill="currentColor" />
    </svg>
  );
}
