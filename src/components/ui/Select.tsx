import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type AriaAttributes,
  type ForwardedRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {Check, ChevronDown} from 'lucide-react';
import './select.css';

/** Values are intentionally string based so a Select can map directly to URL
 * params and form values without coercion. */
export type SelectValue = string;

export interface SelectOption<T extends SelectValue = SelectValue> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps<T extends SelectValue = SelectValue> {
  /** The options shown in the listbox. */
  options: readonly SelectOption<T>[];
  /** Controlled value. */
  value: T;
  /** Called after a non-disabled option is selected. */
  onChange: (value: T) => void;
  /** Optional visible caption rendered above the trigger. */
  label?: ReactNode;
  /** Text shown when value does not match an option. */
  placeholder?: string;
  id?: string;
  className?: string;
  menuClassName?: string;
  size?: SelectSize;
  disabled?: boolean;
  /** Controlled open state. Omit to use defaultOpen/uncontrolled behavior. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
}

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

function setForwardedRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function getFirstEnabledIndex<T extends SelectValue>(options: readonly SelectOption<T>[]) {
  return options.findIndex((option) => !option.disabled);
}

function getEnabledIndex<T extends SelectValue>(
  options: readonly SelectOption<T>[],
  startIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) return -1;

  let index = startIndex;
  for (let count = 0; count < options.length; count += 1) {
    index = (index + direction + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }

  return -1;
}

function SelectImpl<T extends SelectValue>(
  {
    options,
    value,
    onChange,
    label,
    placeholder = '请选择',
    id,
    className,
    menuClassName,
    size = 'md',
    disabled = false,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    name,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-invalid': ariaInvalid,
  }: SelectProps<T>,
  forwardedRef: ForwardedRef<HTMLButtonElement>,
) {
  const generatedId = useId().replaceAll(':', '');
  const triggerId = id ?? `ean-select-${generatedId}`;
  const listboxId = `${triggerId}-listbox`;
  const captionId = `${triggerId}-caption`;
  const valueId = `${triggerId}-value`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isOpenControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const requestedOpen = isOpenControlled ? controlledOpen : uncontrolledOpen;
  const isOpen = !disabled && requestedOpen;
  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );
  const selectedIsEnabled = selectedIndex >= 0 && !options[selectedIndex]?.disabled;
  const firstEnabledIndex = useMemo(() => getFirstEnabledIndex(options), [options]);
  const [highlightedIndex, setHighlightedIndex] = useState(
    selectedIsEnabled ? selectedIndex : firstEnabledIndex,
  );
  const activeHighlightedIndex = isOpen && highlightedIndex >= 0 && !options[highlightedIndex]?.disabled
    ? highlightedIndex
    : selectedIndex >= 0 && !options[selectedIndex]?.disabled
      ? selectedIndex
      : firstEnabledIndex;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (disabled && nextOpen) return;
      if (!isOpenControlled) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [disabled, isOpenControlled, onOpenChange],
  );

  const focusOption = useCallback((index: number) => {
    if (index < 0) return;
    optionRefs.current[index]?.focus();
  }, []);

  const syncHighlight = useCallback(
    (index: number) => {
      if (index < 0 || options[index]?.disabled) return;
      setHighlightedIndex(index);
      focusOption(index);
    },
    [focusOption, options],
  );

  const openAndHighlight = useCallback(
    (index = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex) => {
      const nextIndex = index >= 0 && !options[index]?.disabled ? index : firstEnabledIndex;
      setHighlightedIndex(nextIndex);
      setOpen(true);
    },
    [firstEnabledIndex, options, selectedIndex, setOpen],
  );

  const closeAndFocusTrigger = useCallback(() => {
    triggerRef.current?.focus();
    setOpen(false);
  }, [setOpen]);

  const focusRelativeToTrigger = useCallback((backward: boolean) => {
    const focusableElements = Array.from(document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => (
      element.getClientRects().length > 0
      && getComputedStyle(element).visibility !== 'hidden'
      && !element.closest('[aria-hidden="true"]')
      && (element === triggerRef.current || !rootRef.current?.contains(element))
    ));
    const triggerIndex = triggerRef.current ? focusableElements.indexOf(triggerRef.current) : -1;
    const target = focusableElements[backward ? triggerIndex - 1 : triggerIndex + 1];
    if (target) target.focus();
    else triggerRef.current?.blur();
  }, []);

  const selectOption = useCallback(
    (index: number) => {
      if (disabled) return;
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      setHighlightedIndex(index);
      closeAndFocusTrigger();
    },
    [closeAndFocusTrigger, disabled, onChange, options],
  );

  const moveHighlight = useCallback(
    (direction: 1 | -1) => {
      const current = activeHighlightedIndex >= 0 ? activeHighlightedIndex : firstEnabledIndex;
      const next = getEnabledIndex(options, current, direction);
      if (next >= 0) syncHighlight(next);
    },
    [activeHighlightedIndex, firstEnabledIndex, options, syncHighlight],
  );

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        if (isOpen) closeAndFocusTrigger();
        else openAndHighlight();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) openAndHighlight();
        else moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) openAndHighlight();
        else moveHighlight(-1);
        break;
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          syncHighlight(firstEnabledIndex);
        }
        break;
      case 'End':
        if (isOpen) {
          event.preventDefault();
          const lastEnabledIndex = [...options].reduce(
            (lastIndex, option, optionIndex) => (option.disabled ? lastIndex : optionIndex),
            -1,
          );
          syncHighlight(lastEnabledIndex);
        }
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          closeAndFocusTrigger();
        }
        break;
      case 'Tab':
        if (isOpen) setOpen(false);
        break;
      default:
        break;
    }
  };

  const handleOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        selectOption(index);
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveHighlight(-1);
        break;
      case 'Home':
        event.preventDefault();
        syncHighlight(firstEnabledIndex);
        break;
      case 'End': {
        event.preventDefault();
        const lastEnabledIndex = [...options].reduce(
          (lastIndex, option, optionIndex) => (option.disabled ? lastIndex : optionIndex),
          -1,
        );
        syncHighlight(lastEnabledIndex);
        break;
      }
      case 'Escape':
        event.preventDefault();
        closeAndFocusTrigger();
        break;
      case 'Tab': {
        // Options use roving focus. When Tab leaves the composite widget,
        // explicitly continue from the trigger's place in document order so
        // intermediate options never become extra Tab stops.
        event.preventDefault();
        setOpen(false);
        focusRelativeToTrigger(event.shiftKey);
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    if (!isOpen || activeHighlightedIndex < 0) return;
    const animationFrame = requestAnimationFrame(() => focusOption(activeHighlightedIndex));
    return () => cancelAnimationFrame(animationFrame);
  }, [activeHighlightedIndex, focusOption, isOpen]);

  useEffect(() => {
    if (isOpen || !rootRef.current?.contains(document.activeElement) || document.activeElement === triggerRef.current) return;
    if (disabled) (document.activeElement as HTMLElement | null)?.blur();
    else triggerRef.current?.focus();
  }, [disabled, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        // Move focus out of the option before hiding its aria-hidden parent.
        // The pointer's default action can then place focus on the clicked
        // target when that target is focusable.
        if (rootRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, setOpen]);

  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const displayLabel = selectedOption?.label ?? placeholder;
  const triggerLabelledby = ariaLabelledby ?? (label ? `${captionId} ${valueId}` : undefined);
  const triggerAriaLabel = ariaLabel
    ? `${ariaLabel}，当前：${typeof displayLabel === 'string' ? displayLabel : value}`
    : !triggerLabelledby && typeof displayLabel === 'string'
      ? displayLabel
      : undefined;

  const setTriggerRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      setForwardedRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  return (
    <div
      ref={rootRef}
      className={joinClasses('ui-select', `ui-select--${size}`, isOpen && 'is-open', className)}
      data-state={isOpen ? 'open' : 'closed'}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {label && <span id={captionId} className="ui-select__caption">{label}</span>}
      <button
        ref={setTriggerRef}
        id={triggerId}
        type="button"
        className="ui-select__trigger"
        disabled={disabled}
        aria-label={triggerAriaLabel}
        aria-labelledby={triggerLabelledby}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => (isOpen ? closeAndFocusTrigger() : openAndHighlight())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span id={valueId} className="ui-select__value">{displayLabel}</span>
        <ChevronDown className="ui-select__chevron" aria-hidden="true" focusable="false" />
      </button>
      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
      <div
        id={listboxId}
        role="listbox"
        className={joinClasses('ui-select__menu', menuClassName)}
        aria-label={ariaLabel ?? (typeof displayLabel === 'string' ? displayLabel : undefined)}
        aria-labelledby={ariaLabel ? undefined : triggerId}
        aria-hidden={!isOpen}
        data-state={isOpen ? 'open' : 'closed'}
      >
        {options.map((option, index) => (
          <button
            key={option.value}
            ref={(node) => { optionRefs.current[index] = node; }}
            type="button"
            role="option"
            className={joinClasses(
              'ui-select__option',
              index === activeHighlightedIndex && 'is-highlighted',
              option.value === value && 'is-selected',
            )}
            disabled={option.disabled}
            tabIndex={-1}
            aria-selected={option.value === value}
            aria-disabled={option.disabled || undefined}
            onClick={() => selectOption(index)}
            onKeyDown={(event) => handleOptionKeyDown(event, index)}
          >
            <span className="ui-select__option-label">{option.label}</span>
            {option.value === value && <Check className="ui-select__check" aria-hidden="true" focusable="false" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * EAN's reusable listbox select. `value` is controlled; omit `open` to use an
 * internally managed popup or provide `open`/`onOpenChange` for full control.
 */
const SelectForwarded = forwardRef(SelectImpl);
SelectForwarded.displayName = 'Select';

export const Select = SelectForwarded as <T extends SelectValue = SelectValue>(
  props: SelectProps<T> & { ref?: ForwardedRef<HTMLButtonElement> },
) => ReactElement | null;

export default Select;
