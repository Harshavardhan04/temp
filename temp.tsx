// AGGrid.tsx
import React, { useMemo, useRef, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
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
  height?: string; // container height
}

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

  // Use refs (not state) to avoid extra renders
  const gridApiRef = useRef<GridApi | null>(null);

  const [quickFilter, setQuickFilter] = useState("");

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      floatingFilter: true, // under-header inputs
      resizable: true,
      flex: 1,
      minWidth: 100,
      suppressMenuHide: true,
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
    }),
    []
  );

  // Hide 'id' column by default, keep other flags intact
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
    if (quickFilter) e.api.setQuickFilter(quickFilter);
    if (loading) e.api.showLoadingOverlay();
    else e.api.hideOverlay();
    // Example of column ops (Column API migrated to Grid API):
    // e.api.applyColumnState({ state: [{ colId: 'id', hide: true }] });
  }, [quickFilter, loading]);

  const getRowId = useCallback(
    (p: { data: any }) => String(p.data?.id ?? p.data?.ID ?? p.data?._id ?? Math.random()),
    []
  );

  // Theme variables
  const themeVars: React.CSSProperties = {
    ["--ag-header-background-color" as any]: isDarkMode ? "#1d1a1a" : "#AE1A1A",
    ["--ag-header-foreground-color" as any]: "#ffffff",
    ["--ag-odd-row-background-color" as any]: isDarkMode ? "#424242" : "#f5f5f5",
    ["--ag-even-row-background-color" as any]: isDarkMode ? "#333333" : "#ffffff",
    ["--ag-row-hover-color" as any]: isDarkMode ? "#4a4a4a" : "#e0e0e0",
    ["--ag-foreground-color" as any]: isDarkMode ? "#ffffff" : "#000000",
    ["--ag-background-color" as any]: isDarkMode ? "#333333" : "#ffffff",
  };

  // Keep quick filter in sync
  const onQuickFilterChange = (v: string) => {
    setQuickFilter(v);
    gridApiRef.current?.setQuickFilter(v);
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
      {/* Optional quick filter input (remove if not needed) */}
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Quick filter…"
          value={quickFilter}
          onChange={(e) => onQuickFilterChange(e.target.value)}
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
