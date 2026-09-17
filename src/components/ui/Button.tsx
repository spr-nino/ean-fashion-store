import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from 'react';
import {ArrowRight, LoaderCircle} from 'lucide-react';
import './button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual treatment used by the button. */
  variant?: ButtonVariant;
  /** Size keeps the minimum touch target at or above 40px. */
  size?: ButtonSize;
  /** Replaces the button contents with a non-interactive loading indicator. */
  loading?: boolean;
  loadingLabel?: string;
  /** Optional icon rendered before the button label. */
  leadingIcon?: ReactNode;
  /** Optional icon rendered after the button label. */
  trailingIcon?: ReactNode;
}

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * EAN's shared text button. Use an explicit `type="submit"` when the button
 * submits a form; the safe default is a non-submitting button.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel = '处理中',
    disabled = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
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
      className={joinClasses('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-loading={loading ? 'true' : undefined}
    >
      {loading ? (
        <LoaderCircle className="ui-button__spinner" aria-hidden="true" focusable="false" />
      ) : (
        leadingIcon && <span className="ui-button__icon" aria-hidden="true">{leadingIcon}</span>
      )}
      <span className="ui-button__label" aria-live="polite">{loading ? loadingLabel : children}</span>
      {!loading && trailingIcon && (
        <span className="ui-button__icon ui-button__icon--trailing" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

/** A compact convenience icon for directional CTA buttons. */
export const ArrowButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'trailingIcon'>>(
  function ArrowButton(props, ref) {
    return <Button {...props} ref={ref} trailingIcon={<ArrowRight aria-hidden="true" />} />;
  },
);

ArrowButton.displayName = 'ArrowButton';

export default Button;
