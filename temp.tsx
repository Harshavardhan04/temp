// LCHNotional.tsx
import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { useSelector } from "react-redux";
import moment from "moment";
import type { ColDef, ValueFormatterParams } from "ag-grid-community";

import AGGrid from "../components/AG-Grid-Specific/AGGrid";
import GraphComponent from "../components/LCHGraph/LCHGraphComponent";
import CurrencySelector from "../components/CurrencySelector/CurrencySelector";

import { APP_SERVER_URL } from "../../utils/consts";
import "./../styles/LCHNotional.css";

/** ---------------- Types ---------------- */
interface LCHData {
  Date: string;          // e.g. "2018-06-01"
  Target: number;
  Total: number;
  [currency: string]: string | number; // dynamic currency keys
}

interface RootState {
  root: {
    isDarkMode: boolean;
  };
}

interface TableRow {
  id: number;
  date: string;
  target: number;
  total: number;
  [currency: string]: string | number;
}

interface FormData {
  startDate: moment.Moment;
  endDate: moment.Moment;
  currencies: string[];
}

/** ---------------- Component ---------------- */
const LCHNotional: React.FC = () => {
  /** ----- local state ----- */
  const [data, setData] = useState<LCHData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [compareWithTarget, setCompareWithTarget] = useState<boolean>(false);

  // Default currency selection (same list as before)
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([
    "AUD", "EUR", "GBP", "JPY", "USD", "BRL", "CAD", "CHF", "CLP", "CNY",
    "CZK", "DKK", "HKD", "HUF", "INR", "KRW", "MXN", "NOK", "NZD", "PLN",
    "SEK", "SGD", "THB", "TWD", "ZAR"
  ]);

  /** ----- react-hook-form ----- */
  const methods = useForm<FormData>({
    defaultValues: {
      startDate: moment("2018-06-01"),
      endDate: moment(),
      currencies: selectedCurrencies
    }
  });

  // Only subscribe to the fields we need; avoids re-renders elsewhere
  const watchedStartDate = useWatch({ control: methods.control, name: "startDate" });
  const watchedEndDate   = useWatch({ control: methods.control, name: "endDate"   });

  /** ----- theme ----- */
  const isDarkMode = useSelector((state: RootState) => state?.root?.isDarkMode ?? false);

  /** ----- constants ----- */
  const currencies: string[] = [
    "AUD", "EUR", "GBP", "JPY", "USD", "BRL", "CAD", "CHF", "CLP", "CNY",
    "CZK", "DKK", "HKD", "HUF", "INR", "KRW", "MXN", "NOK", "NZD", "PLN",
    "SEK", "SGD", "THB", "TWD", "ZAR"
  ];

  /** ----- data fetch (mount only) ----- */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${APP_SERVER_URL}xva_data_lch_notional`);
        const json: LCHData[] = await res.json();
        if (alive) setData(json);
      } catch (err) {
        // keep your console error for parity
        // eslint-disable-next-line no-console
        console.error("Error fetching data:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /** ----- helpers ----- */
  const inRange = useCallback(
    (iso: string) => {
      // guard if form not ready
      if (!watchedStartDate || !watchedEndDate) return true;
      const d = moment(iso);
      return d.isSameOrAfter(watchedStartDate, "day") && d.isSameOrBefore(watchedEndDate, "day");
    },
    [watchedStartDate, watchedEndDate]
  );

  /** ----- derived data (memoized) ----- */
  const filteredData: LCHData[] = useMemo(
    () => data.filter(d => inRange(d.Date)),
    [data, inRange]
  );

  const valueFormatter = useCallback(
    (p: ValueFormatterParams<any, any>) => p.value,
    []
  );

  const baseColumns: ColDef[] = useMemo<ColDef[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 100,
        pinned: "left",
        cellStyle: { textAlign: "right" },
        headerClass: "ag-right-aligned-header"
      },
      {
        field: "date",
        headerName: "Date",
        width: 120,
        pinned: "left",
        cellStyle: { textAlign: "left" },
        headerClass: "ag-right-aligned-header"
      },
      {
        field: "target",
        headerName: "Target",
        width: 150,
        cellStyle: { textAlign: "right" },
        headerClass: "ag-right-aligned-header",
        valueFormatter
      }
    ],
    [valueFormatter]
  );

  const currencyColumns: ColDef[] = useMemo<ColDef[]>(
    () =>
      selectedCurrencies.map((currency): ColDef => ({
        field: currency,
        headerName: currency,
        width: 150,
        cellStyle: { textAlign: "right" },
        headerClass: "ag-right-aligned-header",
        valueFormatter
      })),
    [selectedCurrencies, valueFormatter]
  );

  const totalColumn: ColDef = useMemo<ColDef>(
    () => ({
      field: "total",
      headerName: "Total",
      width: 150,
      pinned: "right",
      cellStyle: { textAlign: "right" },
      headerClass: "ag-right-aligned-header",
      valueFormatter
    }),
    [valueFormatter]
  );

  const columns: ColDef[] = useMemo(
    () => [...baseColumns, ...currencyColumns, totalColumn],
    [baseColumns, currencyColumns, totalColumn]
  );

  const rows: TableRow[] = useMemo(() => {
    return filteredData.map((d, idx) => {
      const row: TableRow = {
        id: idx + 1,
        date: d.Date,
        target: d.Target,
        total: d.Total
      };
      // attach only the selected currencies to keep row shape tight
      selectedCurrencies.forEach((ccy) => {
        row[ccy] = d[ccy];
      });
      return row;
    });
  }, [filteredData, selectedCurrencies]);

  /** ----- classes (unchanged names) ----- */
  const graphContainerClass = isDarkMode ? "graph-container dark" : "graph-container light";
  const tableContainerClass = isDarkMode ? "table-container dark" : "table-container light";
  const titleClass = isDarkMode ? "lch-title dark" : "lch-title light";

  /** ----- render ----- */
  return (
    <div className="form-provider-wrapper">
      <FormProvider {...methods}>
        <div className={graphContainerClass}>
          <h2 className={titleClass}>LCH Notional | Time Series</h2>

          <div className="selectors-container">
            {/* Dates in a row */}
            <div className="date-selectors-row">
              <div className="selector-wrapper">
                <SmuISelectDate<FormData> name="startDate" label="Start Date" />
              </div>
              <div className="selector-wrapper">
                <SmuISelectDate<FormData> name="endDate" label="End Date" />
              </div>
            </div>

            {/* Currencies below */}
            <div className="currency-selector-row">
              <div className="currency-selector">
                <CurrencySelector
                  options={currencies}
                  selectedCurrencies={selectedCurrencies}
                  setSelectedCurrencies={setSelectedCurrencies}
                  name="currencies"
                />
              </div>
            </div>
          </div>

          <div className="main-panel">
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner" />
              </div>
            )}

            <GraphComponent
              startDate={watchedStartDate?.toDate() ?? new Date("2018-06-01")}
              endDate={watchedEndDate?.toDate() ?? new Date()}
              selectedCurrencies={selectedCurrencies}
              isDarkMode={isDarkMode}
              data={filteredData}
              compareWithTarget={compareWithTarget}
              setCompareWithTarget={setCompareWithTarget}
            />
          </div>
        </div>

        <div className={tableContainerClass}>
          <h2 className={titleClass}>LCH Notional | Summary Table</h2>
          <AGGrid rows={rows} columns={columns} loading={loading} />
        </div>
      </FormProvider>
    </div>
  );
};

export default LCHNotional;
