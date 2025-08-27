// AGGrid.tsx (AG Grid v32+)
import React, {
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  GetRowIdParams,
} from "ag-grid-community";

import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-community/styles/ag-theme-alpine-dark.css";

interface RootState {
  root: { isDarkMode: boolean };
}

interface AGGridProps {
  rows: any[];
  columns: ColDef[];
  loading?: boolean;
  height?: string; // container height (CSS)
}

// --- Side bar config (Columns + Filters) ---
const sideBarConfig = {
  toolPanels: [
    {
      id: "columns",
      labelDefault: "Columns",
      labelKey: "columns",
      iconKey: "columns",
      toolPanel: "agColumnsToolPanel",
    },
    {
      id: "filters",
      labelDefault: "Filters",
      labelKey: "filters",
      iconKey: "filter",
      toolPanel: "agFiltersToolPanel",
    },
  ],
  defaultToolPanel: "agColumnsToolPanel",
} as const;

// --- Overlays (optional) ---
const LoadingOverlayComponent: React.FC = () => (
  <span className="ag-overlay-loading-center">Loading...</span>
);
const NoRowsOverlayComponent: React.FC = () => (
  <span className="ag-overlay-no-rows-center">No Rows To Show</span>
);

const AGGrid: React.FC<AGGridProps> = ({
  rows,
  columns,
  loading = false,
  height = "calc(100vh - 100px)",
}) => {
  const isDarkMode = useSelector((s: RootState) => s.root.isDarkMode);

  // Grid API (useRef to avoid re-renders)
  const gridApiRef = useRef<GridApi | null>(null);

  // Quick filter text (optional input below)
  const [quickFilter, setQuickFilter] = useState("");

  // Classic header with dropdown filters (no floating filters)
  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      filter: true, // enables column filter menu
      // floatingFilter: false, // <-- default is false; omit for one-row header
      resizable: true,
      flex: 1,
      minWidth: 100,
      suppressMenuHide: true, // keep menu visible
    }),
    []
  );

  const gridOptions: GridOptions = useMemo(
    () => ({
      pagination: true,
      paginationPageSize: 25,
      paginationPageSizeSelector: [25, 50, 100],
      enableRangeSelection: true,
      rowSelection: "multiple",
      animateRows: true,
      cacheQuickFilter: true,
      // v32 overlays are controlled via 'loading' option
      loading: loading,
      quickFilterText: quickFilter,
    }),
    // base options don’t change; 'loading'/'quickFilterText' are updated via setGridOption below
    []
  );

  // Prepare column defs (hide 'id' by default if present)
  const columnDefsMemo = useMemo<ColDef[]>(
    () =>
      columns.map((c) => ({
        ...c,
        hide: c.field === "id" ? true : !!c.hide,
      })),
    [columns]
  );

  const rowDataMemo = useMemo(() => rows, [rows]);

  const onGridReady = useCallback((e: GridReadyEvent) => {
    gridApiRef.current = e.api;
    // initialize runtime options (v32 style)
    e.api.setGridOption("loading", loading);
    if (quickFilter) e.api.setGridOption("quickFilterText", quickFilter);
    // Example: former ColumnApi calls now via GridApi
    // e.api.applyColumnState({ state: [{ colId: 'id', hide: true }] });
  }, [loading, quickFilter]);

  // Keep grid in sync when props/state change after ready
  useEffect(() => {
    if (!gridApiRef.current) return;
    gridApiRef.current.setGridOption("loading", loading);
  }, [loading]);

  useEffect(() => {
    if (!gridApiRef.current) return;
    gridApiRef.current.setGridOption("quickFilterText", quickFilter);
  }, [quickFilter]);

  // v32-typed getRowId for stable updates
  const getRowId = useCallback((p: GetRowIdParams<any>) => {
    const d = p.data;
    return String(d?.id ?? d?.ID ?? d?._id ?? Math.random());
  }, []);

  // Theme variables (header/rows)
  const themeVars: React.CSSProperties = {
    ["--ag-header-background-color" as any]: isDarkMode ? "#1d1a1a" : "#AE1A1A",
    ["--ag-header-foreground-color" as any]: "#ffffff",
    ["--ag-odd-row-background-color" as any]: isDarkMode ? "#424242" : "#f5f5f5",
    ["--ag-even-row-background-color" as any]: isDarkMode ? "#333333" : "#ffffff",
    ["--ag-row-hover-color" as any]: isDarkMode ? "#4a4a4a" : "#e0e0e0",
    ["--ag-foreground-color" as any]: isDarkMode ? "#ffffff" : "#000000",
    ["--ag-background-color" as any]: isDarkMode ? "#333333" : "#ffffff",
  };

  return (
    <div
      style={{
        height,
        overflow: "auto",
        paddingRight: 5,
        boxSizing: "border-box",
      }}
    >
      {/* Optional quick filter box (remove if not needed) */}
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Quick filter…"
          value={quickFilter}
          onChange={(e) => setQuickFilter(e.target.value)}
          style={{ width: 240, padding: 6 }}
        />
      </div>

      <div
        className={isDarkMode ? "ag-theme-alpine-dark" : "ag-theme-alpine"}
        style={{ width: "100%", height: "100%", ...themeVars }}
      >
        <AgGridReact
          rowData={rowDataMemo}
          columnDefs={columnDefsMemo}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          sideBar={sideBarConfig}
          rowGroupPanelShow="always"
          loadingOverlayComponent={LoadingOverlayComponent}
          noRowsOverlayComponent={NoRowsOverlayComponent}
          getRowId={getRowId}
          suppressDragLeaveHidesColumns
        />
      </div>
    </div>
  );
};

export default AGGrid;
