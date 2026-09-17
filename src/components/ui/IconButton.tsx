import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from 'react';
import {LoaderCircle} from 'lucide-react';
import type {ButtonSize, ButtonVariant} from './Button';
import './button.css';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label'
> & {
  /** The icon to display. Lucide icons are recommended for a consistent stroke. */
  icon: ReactNode;
  /** An accessible name is required because the button has no visible text label. */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

/** Shared square icon control with a minimum 40px pointer and keyboard target. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    variant = 'ghost',
    size = 'md',
    loading = false,
    disabled = false,
    className,
    type,
    ...buttonProps
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type ?? 'button'}
      className={joinClasses('ui-icon-button', `ui-icon-button--${variant}`, `ui-icon-button--${size}`, className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-loading={loading ? 'true' : undefined}
    >
      {loading ? (
        <LoaderCircle className="ui-icon-button__spinner" aria-hidden="true" focusable="false" />
      ) : (
        <span className="ui-icon-button__icon" aria-hidden="true">{icon}</span>
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

export default IconButton;
