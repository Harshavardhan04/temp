// CurrencySelector.tsx
import React from "react";
import { Box, Chip } from "@mui/material";
import {
  FormProvider,
  useForm,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import { SmuiMultiSelect, SmuiCheckbox } from "strats_utils/components";
import "./CurrencySelector.css";

interface Option {
  value: string;
  label: string;
}

interface CurrencySelectorProps {
  options: string[];
  selectedCurrencies: string[];
  setSelectedCurrencies: (currencies: string[]) => void;
  name: string; // kept for API parity
}

interface FormData {
  currencies: string[];
  selectAllSwitch: boolean; // we still keep this field, now driven by the header checkbox
}

function computeAllState(selected: string[], all: string[]) {
  const total = all.length;
  const sel = selected.length;
  return {
    checked: sel > 0 && sel === total,
    indeterminate: sel > 0 && sel < total,
  };
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  options,
  selectedCurrencies,
  setSelectedCurrencies,
}) => {
  const allSelectedInitial = selectedCurrencies.length === options.length;

  const methods: UseFormReturn<FormData> = useForm<FormData>({
    defaultValues: {
      currencies: selectedCurrencies,
      selectAllSwitch: allSelectedInitial,
    },
  });

  const watchedCurrencies = useWatch({
    control: methods.control,
    name: "currencies",
  });
  const watchedSelectAll = useWatch({
    control: methods.control,
    name: "selectAllSwitch",
  });

  const smuiOptions: Option[] = React.useMemo(
    () => options.map((opt) => ({ value: opt, label: opt })),
    [options]
  );

  // Chips renderer (2 visible + "+X more")
  const renderTags = React.useCallback(
    (
      tagValue: Option[],
      getTagProps: (args: { index: number }) => Record<string, unknown>
    ): React.ReactNode => {
      const maxVisible = 2;
      const visibleTags = tagValue.slice(0, maxVisible);
      const remainingCount = tagValue.length - maxVisible;

      return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
          {visibleTags.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.value}
              label={option.label}
              size="small"
              className="currency-chip"
            />
          ))}
          {remainingCount > 0 && (
            <Chip
              label={`+${remainingCount} more`}
              size="small"
              className="currency-chip-more"
              variant="outlined"
            />
          )}
        </Box>
      );
    },
    []
  );

  // Sync parent when internal selection changes; keep checkbox state aligned
  React.useEffect(() => {
    const arr = Array.isArray(watchedCurrencies)
      ? (watchedCurrencies as string[])
      : [];
    setSelectedCurrencies(arr);

    const { checked } = computeAllState(arr, options);
    if (checked !== watchedSelectAll) {
      methods.setValue("selectAllSwitch", checked, {
        shouldValidate: false,
        shouldTouch: false,
      });
    }
  }, [watchedCurrencies, watchedSelectAll, options, methods, setSelectedCurrencies]);

  // If parent updates selectedCurrencies, reflect here
  React.useEffect(() => {
    methods.setValue("currencies", selectedCurrencies, {
      shouldValidate: false,
      shouldTouch: false,
      shouldDirty: false,
    });
    const { checked } = computeAllState(selectedCurrencies, options);
    methods.setValue("selectAllSwitch", checked, {
      shouldValidate: false,
      shouldTouch: false,
      shouldDirty: false,
    });
  }, [selectedCurrencies, options, methods]);

  // Render a sticky header for the dropdown list with our SmuiCheckbox
  const renderListboxWithHeader = React.useCallback(
    (listbox: React.ReactNode) => {
      const selected = methods.getValues("currencies") ?? [];
      const { checked, indeterminate } = computeAllState(selected, options);

      // SmuiCheckbox is RHF-bound, so change its value via setValue AND also
      // update the currencies list to actually perform the select-all action.
      const onToggleAll = (nextChecked: boolean) => {
        methods.setValue("selectAllSwitch", nextChecked, { shouldTouch: true });
        if (nextChecked) {
          methods.setValue("currencies", [...options], {
            shouldDirty: true,
            shouldTouch: true,
          });
          setSelectedCurrencies(options);
        } else {
          methods.setValue("currencies", [], {
            shouldDirty: true,
            shouldTouch: true,
          });
          setSelectedCurrencies([]);
        }
      };

      return (
        <div>
          <div
            className="select-all-header"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "var(--mui-popper-bg, #fff)",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseDown={(e) => e.stopPropagation()} // keep dropdown open
          >
            <SmuiCheckbox<FormData>
              name="selectAllSwitch"
              label={checked ? "Deselect all" : indeterminate ? "Select all (partial)" : "Select all"}
              // We need to reflect the tri-state; MUI supports 'indeterminate' prop on Checkbox,
              // your SmuiCheckbox wrapper forwards props via ...rest, so we pass it via 'rest' props.
              // @ts-expect-error: extra prop forwarded through SmuiCheckbox to MUI Checkbox
              indeterminate={indeterminate}
              onChange={(_, value?: boolean) => {
                // Some wrappers pass (event) only; handle both signatures safely:
                if (typeof value === "boolean") onToggleAll(value);
                else onToggleAll(!checked);
              }}
            />
          </div>
          {listbox}
        </div>
      );
    },
    [methods, options, setSelectedCurrencies]
  );

  return (
    <FormProvider {...methods}>
      <Box className="currency-selector-container">
        <SmuiMultiSelect<FormData>
          name="currencies"
          label="Select Currencies"
          options={smuiOptions}
          renderTags={renderTags}
          // Put the subtle "Select all" checkbox into the dropdown panel
          renderListbox={renderListboxWithHeader as any}
          sx={{
            "& .MuiAutocomplete-option": { minHeight: "24px" },
            "& .MuiAutocomplete-inputRoot": { minHeight: "56px", padding: "8px 12px" },
          }}
        />
      </Box>
    </FormProvider>
  );
};

export default CurrencySelector;
