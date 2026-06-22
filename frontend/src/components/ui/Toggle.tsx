import clsx from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, label, description, disabled = false, size = 'md' }: ToggleProps) {
  const sizeStyles = size === 'sm' ? 'w-8 h-5' : 'w-11 h-6';
  const dotSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const translateOn = size === 'sm' ? 'translate-x-[14px]' : 'translate-x-[22px]';

  return (
    <label
      className={clsx(
        'flex items-start gap-3',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200 mt-0.5',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
          sizeStyles,
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform duration-200',
            dotSize,
            checked ? translateOn : 'translate-x-0'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
          )}
          {description && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
