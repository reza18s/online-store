import { useEffect, useId, useRef, useState } from 'react';

import type { CatalogFacetOption } from '@nova/api-client';

import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  isLoading = false,
  disabled = false,
  defaultOpen,
}: {
  label: string;
  value: string;
  options: readonly CatalogFacetOption[];
  onChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
}) {
  const groupName = 'filter-' + useId();
  const optionsId = groupName + '-options';
  const [isOpen, setIsOpen] = useState(() => defaultOpen ?? (label === 'دسته‌بندی' && !value));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      return;
    }
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [disabled, isOpen]);

  return (
    <div ref={rootRef} className={'filter-select' + (isOpen ? ' is-open' : '')}>
      <button
        ref={triggerRef}
        className="filter-select__trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls={optionsId}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="filter-select__label">{label}</span>
        {selectedOption ? (
          <span className="filter-select__selected" title={selectedOption.label}>
            {selectedOption.label}
          </span>
        ) : null}
        <span className="filter-select__chevron" aria-hidden="true">
          <Icon name="chevron-down" size={15} />
        </span>
      </button>
      <div className="filter-select__options" id={optionsId} hidden={!isOpen}>
        {isLoading ? (
          <div
            className="filter-select__loading"
            role="status"
            aria-label={'در حال بارگذاری ' + label}
          >
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : (
          <fieldset className="filter-select__group" disabled={disabled}>
            <legend className="sr-only">{label}</legend>
            <label className={'filter-select__option' + (value ? '' : ' is-selected')}>
              <input
                type="radio"
                name={groupName}
                value=""
                checked={!value}
                onChange={() => onChange('')}
              />
              <span className="filter-select__indicator" aria-hidden="true">
                {!value ? <Icon name="check" size={12} /> : null}
              </span>
              <span className="filter-select__option-label">همه</span>
            </label>
            {options.map((option) => {
              const isSelected = value === option.value;

              return (
                <label
                  className={'filter-select__option' + (isSelected ? ' is-selected' : '')}
                  key={option.value}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onChange(option.value)}
                  />
                  <span
                    className={
                      'filter-select__indicator' +
                      (option.hex ? ' filter-select__indicator--swatch' : '')
                    }
                    style={option.hex ? { backgroundColor: option.hex } : undefined}
                    aria-hidden="true"
                  >
                    {!option.hex && isSelected ? <Icon name="check" size={12} /> : null}
                  </span>
                  <span className="filter-select__option-label">{option.label}</span>
                  {option.count > 0 ? (
                    <small className="filter-select__count">
                      {formatPersianNumber(option.count)}
                    </small>
                  ) : null}
                </label>
              );
            })}
          </fieldset>
        )}
      </div>
    </div>
  );
}
