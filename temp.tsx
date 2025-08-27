// CurrencySelector.tsx
import React from "react";
import { Box, Chip } from "@mui/material";
import {
  FormProvider,
  useForm,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import { SmuiMultiSelect, SmuiSwitch } from "strats_utils/components";
import "./CurrencySelector.css";

/** Option shape used by the SmuiMultiSelect */
interface Option {
  value: string;
  label: string;
}

/** Props from parent (unchanged public contract) */
interface CurrencySelectorProps {
  /** List of available currency codes (e.g., ["USD","GBP",...]) */
  options: string[];
  /** Current selected currency codes */
  selectedCurrencies: string[];
  /** Upstream setter to sync selection back to parent */
  setSelectedCurrencies: (currencies: string[]) => void;
  /** Name displayed in some contexts (kept for API parity) */
  name: string;
}

/** Form values handled locally via RHF */
interface FormData {
  currencies: string[];
  selectAllSwitch: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  options,
  selectedCurrencies,
  setSelectedCurrencies,
  name,
}) => {
  // Determine if all currencies are currently selected
  const allSelectedInitial = selectedCurrencies.length === options.length;

  // RHF setup with initial defaults
  const methods: UseFormReturn<FormData> = useForm<FormData>({
    defaultValues: {
      currencies: selectedCurrencies,
      selectAllSwitch: allSelectedInitial,
    },
  });

  // Watch relevant fields (cleaner than subscribe/unsubscribe)
  const watchedCurrencies = useWatch({
    control: methods.control,
    name: "currencies",
  });
  const watchedSelectAll = useWatch({
    control: methods.control,
    name: "selectAllSwitch",
  });

  // Map raw string options to {value,label} for SmuiMultiSelect
  const smuiOptions: Option[] = React.useMemo(
    () => options.map((opt) => ({ value: opt, label: opt })),
    [options]
  );

  /** Handle Select All / Deselect All toggle */
  const handleSwitchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;

      if (isChecked) {
        // select all
        setSelectedCurrencies(options);
        methods.setValue("currencies", [...options], {
          shouldTouch: true,
          shouldDirty: true,
        });
      } else {
        // deselect all
        setSelectedCurrencies([]);
        methods.setValue("currencies", [], {
          shouldTouch: true,
          shouldDirty: true,
        });
      }

      methods.setValue("selectAllSwitch", isChecked, {
        shouldTouch: true,
      });
    },
    [methods, options, setSelectedCurrencies]
  );

  /** Render limited chips with a "+X more" chip */
  const renderTags = React.useCallback(
    (
      tagValue: Option[],
      getTagProps: (args: { index: number }) => Record<string, unknown>
    ): React.ReactNode => {
      const maxVisible = 2; // show first 2
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

  /** Keep parent in sync when internal selection changes */
  React.useEffect(() => {
    if (Array.isArray(watchedCurrencies)) {
      // Ensure string[] (SmuiMultiSelect provides values as strings)
      setSelectedCurrencies(watchedCurrencies as string[]);
    }

    // Auto-sync the switch when user manually selects/deselects
    const allSelectedNow =
      Array.isArray(watchedCurrencies) &&
      watchedCurrencies.length === options.length;

    if (allSelectedNow !== watchedSelectAll) {
      methods.setValue("selectAllSwitch", allSelectedNow, {
        shouldValidate: false,
        shouldTouch: false,
      });
    }
  }, [
    watchedCurrencies,
    watchedSelectAll,
    options.length,
    methods,
    setSelectedCurrencies,
  ]);

  /** If parent changes selectedCurrencies prop, update the form */
  React.useEffect(() => {
    methods.setValue("currencies", selectedCurrencies, {
      shouldValidate: false,
      shouldTouch: false,
      shouldDirty: false,
    });
    const allSelected = selectedCurrencies.length === options.length;
    methods.setValue("selectAllSwitch", allSelected, {
      shouldValidate: false,
      shouldTouch: false,
      shouldDirty: false,
    });
  }, [selectedCurrencies, options.length, methods]);

  return (
    <FormProvider {...methods}>
      <Box className="currency-selector-container">
        <SmuiMultiSelect<FormData>
          name="currencies"
          label="Select Currencies"
          options={smuiOptions}
          // custom tags renderer with "+X more"
          renderTags={renderTags}
          sx={{
            "& .MuiAutocomplete-option": { minHeight: "24px" },
            "& .MuiAutocomplete-inputRoot": { minHeight: "56px", padding: "8px 12px" },
          }}
        />

        {/* Select All / Deselect All Toggle */}
        <Box className="select-all-switch-container">
          <SmuiSwitch<FormData>
            name="selectAllSwitch"
            left_label="Deselect All"
            right_label="Select All"
            handleChange={handleSwitchChange}
          />
        </Box>
      </Box>
    </FormProvider>
  );
};

export default CurrencySelector;
