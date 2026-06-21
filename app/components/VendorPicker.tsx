import { useState, useCallback } from "react";
import { Autocomplete, Icon, LegacyStack, Tag } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";

interface VendorPickerProps {
  vendors: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function VendorPicker({ vendors, selected, onChange }: VendorPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(() =>
    vendors.map((v) => ({ value: v, label: v }))
  );

  const updateText = useCallback(
    (value: string) => {
      setInputValue(value);
      if (value === "") {
        setOptions(vendors.map((v) => ({ value: v, label: v })));
        return;
      }
      const filterRegex = new RegExp(value, "i");
      const resultOptions = vendors
        .filter((v) => v.match(filterRegex))
        .map((v) => ({ value: v, label: v }));
      
      // Allow adding custom vendor if not in list
      if (!resultOptions.find(o => o.value.toLowerCase() === value.toLowerCase())) {
        resultOptions.push({ value, label: `Add "${value}"` });
      }

      setOptions(resultOptions);
    },
    [vendors]
  );

  const updateSelection = useCallback(
    (newSelected: string[]) => {
      // Find if we selected an "Add X" custom option and use its actual value
      const cleanedSelection = newSelected.map(val => {
        const option = options.find(o => o.value === val);
        if (option && option.label.startsWith('Add "')) {
          return val; // It's a custom value
        }
        return val;
      });
      onChange(cleanedSelection);
      setInputValue("");
      setOptions(vendors.map((v) => ({ value: v, label: v })));
    },
    [onChange, options, vendors]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(selected.filter((s) => s !== tag));
    },
    [onChange, selected]
  );

  const textField = (
    <Autocomplete.TextField
      label="Search vendors"
      labelHidden
      onChange={updateText}
      value={inputValue}
      prefix={<Icon source={SearchIcon} />}
      placeholder="Search or add vendors"
      autoComplete="off"
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Autocomplete
        allowMultiple
        options={options}
        selected={selected}
        textField={textField}
        onSelect={updateSelection}
        listTitle="Suggested Vendors"
      />
      {selected.length > 0 ? (
        <LegacyStack spacing="tight">
          {selected.map((option) => (
            <Tag key={option} onRemove={() => removeTag(option)}>
              {option}
            </Tag>
          ))}
        </LegacyStack>
      ) : null}
    </div>
  );
}
