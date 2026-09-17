import {forwardRef, type ReactNode} from 'react';
import {Link, type LinkProps} from 'react-router-dom';
import type {ButtonSize, ButtonVariant} from './Button';
import './button.css';

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  trailingIcon?: ReactNode;
  leadingIcon?: ReactNode;
}

const joinClasses = (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(' ');

/** Route-aware counterpart to Button for navigation CTAs. */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  {variant = 'primary', size = 'md', trailingIcon, leadingIcon, className, children, ...props},
  ref,
) {
  return <Link {...props} ref={ref} className={joinClasses('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className)}>
    {leadingIcon && <span className="ui-button__icon" aria-hidden="true">{leadingIcon}</span>}
    <span className="ui-button__label">{children}</span>
    {trailingIcon && <span className="ui-button__icon ui-button__icon--trailing" aria-hidden="true">{trailingIcon}</span>}
  </Link>;
});

LinkButton.displayName = 'LinkButton';

export default LinkButton;
