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

/** Option shape used by SmuiMultiSelect */
interface Option {
  value: string;
  label: string;
}

/** Props from parent (public contract unchanged) */
interface CurrencySelectorProps {
  options: string[];                          // e.g. ["USD","GBP",...]
  selectedCurrencies: string[];               // controlled value from parent
  setSelectedCurrencies: (c: string[]) => void;
  name: string;                               // kept for API parity
}

/** Local form state */
interface FormData {
  currencies: string[];
  selectAll: boolean;                         // driven by the checkbox
}

/** Derive tri-state from current selection */
function getAllState(selected: string[], all: string[]) {
  const total = all.length;
  const sel = selected.length;
  const checked = sel > 0 && sel === total;
  const indeterminate = sel > 0 && sel < total;
  return { checked, indeterminate };
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  options,
  selectedCurrencies,
  setSelectedCurrencies,
}) => {
  // RHF setup
  const methods: UseFormReturn<FormData> = useForm<FormData>({
    defaultValues: {
      currencies: selectedCurrencies,
      selectAll: selectedCurrencies.length === options.length,
    },
  });

  // Watch relevant fields
  const watchCurrencies = useWatch({ control: methods.control, name: "currencies" });

  // Map raw strings to Option[]
  const smuiOptions = React.useMemo<Option[]>(
    () => options.map((opt) => ({ value: opt, label: opt })),
    [options]
  );

  /** Render up to 2 chips, then "+X more" */
  const renderTags = React.useCallback(
    (
      tagValue: Option[],
      getTagProps: (args: { index: number }) => Record<string, unknown>
    ): React.ReactNode => {
      const maxVisible = 2;
      const visible = tagValue.slice(0, maxVisible);
      const remaining = Math.max(tagValue.length - maxVisible, 0);

      return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
          {visible.map((opt, i) => (
            <Chip
              {...getTagProps({ index: i })}
              key={opt.value}
              label={opt.label}
              size="small"
              className="currency-chip"
            />
          ))}
          {remaining > 0 && (
            <Chip
              label={`+${remaining} more`}
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

  /** Keep parent prop in sync when internal selection changes */
  React.useEffect(() => {
    const curr = Array.isArray(watchCurrencies) ? (watchCurrencies as string[]) : [];
    setSelectedCurrencies(curr);

    // sync checkbox state (tri-state: we set 'checked' only; 'indeterminate' is visual)
    const { checked } = getAllState(curr, options);
    if (methods.getValues("selectAll") !== checked) {
      methods.setValue("selectAll", checked, { shouldValidate: false, shouldTouch: false, shouldDirty: false });
    }
  }, [watchCurrencies, options, methods, setSelectedCurrencies]);

  /** Reflect parent updates back into the form (no loops) */
  React.useEffect(() => {
    const curr = methods.getValues("currencies");
    // only update if different, to avoid extra renders
    const same =
      Array.isArray(curr) &&
      curr.length === selectedCurrencies.length &&
      curr.every((v, i) => v === selectedCurrencies[i]);

    if (!same) {
      methods.setValue("currencies", selectedCurrencies, {
        shouldValidate: false,
        shouldTouch: false,
        shouldDirty: false,
      });
    }

    const newAll = selectedCurrencies.length === options.length;
    if (methods.getValues("selectAll") !== newAll) {
      methods.setValue("selectAll", newAll, {
        shouldValidate: false,
        shouldTouch: false,
        shouldDirty: false,
      });
    }
  }, [selectedCurrencies, options.length, methods]);

  /** Toggle handler for the subtle "Select all" checkbox */
  const handleSelectAllChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;
      if (isChecked) {
        if (methods.getValues("currencies").length !== options.length) {
          methods.setValue("currencies", [...options], { shouldDirty: true, shouldTouch: true });
          setSelectedCurrencies(options);
        }
      } else {
        if (methods.getValues("currencies").length !== 0) {
          methods.setValue("currencies", [], { shouldDirty: true, shouldTouch: true });
          setSelectedCurrencies([]);
        }
      }
      // RHF field mirrors the visual checked state
      if (methods.getValues("selectAll") !== isChecked) {
        methods.setValue("selectAll", isChecked, { shouldTouch: true });
      }
    },
    [methods, options, setSelectedCurrencies]
  );

  // Compute tri-state for the checkbox
  const { checked: allChecked, indeterminate } = getAllState(
    methods.getValues("currencies") ?? [],
    options
  );

  return (
    <FormProvider {...methods}>
      <Box className="currency-selector-container">
        <SmuiMultiSelect<FormData>
          name="currencies"
          label="Select Currencies"
          options={smuiOptions}
          renderTags={renderTags}
          sx={{
            "& .MuiAutocomplete-option": { minHeight: "24px" },
            "& .MuiAutocomplete-inputRoot": { minHeight: "56px", padding: "8px 12px" },
          }}
        />

        {/* Subtle Select-All control (compact checkbox below the field) */}
        <Box
          className="select-all-checkbox-container"
          sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
        >
          <SmuiCheckbox<FormData>
            name="selectAll"
            label={allChecked ? "Deselect all" : "Select all"}
            indeterminate={indeterminate}   // forwarded to MUI Checkbox
            onChange={handleSelectAllChange}
            size="small"
          />
        </Box>
      </Box>
    </FormProvider>
  );
};

export default CurrencySelector;
