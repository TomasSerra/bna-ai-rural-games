import * as React from 'react';
import { cn } from '@shared/lib/utils';

/** Generic lucide/SVG icon component type (shared across games). */
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  icon: IconComponent;
  label: string;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected, icon: Icon, label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={selected}
        data-state={selected ? 'on' : 'off'}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-5 py-3 text-xl font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
          'disabled:opacity-50 disabled:pointer-events-none',
          selected
            ? 'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
            : 'border-transparent bg-white/80 text-primary hover:bg-white',
          className
        )}
        {...props}
      >
        <Icon className="size-6 shrink-0" />
        <span>{label}</span>
      </button>
    );
  }
);
Chip.displayName = 'Chip';
