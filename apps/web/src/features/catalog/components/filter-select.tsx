import { useEffect, useId, useRef, useState } from 'react';

import type { CatalogFacetOption } from '@nova/api-client';

import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

type FilterSelectAppearance = 'list' | 'size' | 'swatches';
const visibleOptionLimit = 5;

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  isLoading = false,
  disabled = false,
  defaultOpen,
  appearance = 'list',
  showAllOption = true,
  showMoreOptions = false,
}: {
  label: string;
  value: string;
  options: readonly CatalogFacetOption[];
  onChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
  appearance?: FilterSelectAppearance;
  showAllOption?: boolean;
  showMoreOptions?: boolean;
}) {
  const groupName = 'filter-' + useId();
  const optionsId = groupName + '-options';
  const [isOpen, setIsOpen] = useState(() => defaultOpen ?? (label === 'دسته‌بندی' && !value));
  const [isShowingAllOptions, setIsShowingAllOptions] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const selectedOptionIndex = options.findIndex((option) => option.value === value);
  const shouldShowMore =
    appearance === 'list' && showMoreOptions && options.length > visibleOptionLimit;
  const visibleOptions =
    shouldShowMore && !isShowingAllOptions
      ? selectedOptionIndex >= visibleOptionLimit && selectedOption
        ? [...options.slice(0, visibleOptionLimit - 1), selectedOption]
        : options.slice(0, visibleOptionLimit)
      : options;

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
    <div
      ref={rootRef}
      className={'filter-select filter-select--' + appearance + (isOpen ? ' is-open' : '')}
    >
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
        ) : options.length === 0 ? (
          <div className="filter-select__empty" role="status">
            موردی برای نمایش نیست
          </div>
        ) : (
          <>
            <fieldset
              className={'filter-select__group filter-select__group--' + appearance}
              disabled={disabled}
            >
              <legend className="sr-only">{label}</legend>
              {showAllOption ? (
                <label
                  className={
                    'filter-select__option filter-select__option--' +
                    appearance +
                    (!value ? ' is-selected' : '')
                  }
                >
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
              ) : null}
              {visibleOptions.map((option) => {
                const isSelected = value === option.value;
                const showSwatch = appearance === 'swatches' && Boolean(option.hex);

                return (
                  <label
                    className={
                      'filter-select__option filter-select__option--' +
                      appearance +
                      (isSelected ? ' is-selected' : '')
                    }
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
                        (showSwatch ? ' filter-select__indicator--swatch' : '')
                      }
                      style={showSwatch ? { backgroundColor: option.hex ?? undefined } : undefined}
                      aria-hidden="true"
                    >
                      {!showSwatch && isSelected ? <Icon name="check" size={12} /> : null}
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
            {shouldShowMore ? (
              <button
                className="filter-select__more"
                type="button"
                aria-expanded={isShowingAllOptions}
                onClick={() => setIsShowingAllOptions((showing) => !showing)}
              >
                {isShowingAllOptions ? 'نمایش کمتر' : 'مشاهده بیشتر'}
                <Icon name="chevron-down" size={13} />
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
