import type { CatalogFacetOption } from '@nova/api-client';
import { Select as UiSelect } from '@nova/ui';

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly CatalogFacetOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="filter-select">
      <span>{label}</span>
      <UiSelect
        className="filter-select__control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">همه</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.count ? ` (${option.count})` : ''}
          </option>
        ))}
      </UiSelect>
    </label>
  );
}
