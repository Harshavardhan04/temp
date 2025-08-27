// AGGrid.tsx
import React, { useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridApi,
  ColumnApi,
  GridOptions,
  GridReadyEvent,
} from "ag-grid-community";

import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-community/styles/ag-theme-alpine-dark.css";

// ---------- Types ----------
interface AGGridProps {
  rows: any[];
  columns: ColDef[];
  loading?: boolean;
}

interface RootState {
  root: {
    isDarkMode: boolean;
  };
}

// ---------- Reusable SideBar config ----------
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

// ---------- Loading overlay as JSX ----------
const LoadingOverlayComponent: React.FC = () => (
  <span className="ag-overlay-loading-center">Loading...</span>
);

// ============================================

const AGGrid: React.FC<AGGridProps> = ({ rows, columns, loading = false }) => {
  const isDarkMode = useSelector((state: RootState) => state.root.isDarkMode);

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null);

  // Default column defs
  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 100,
      suppressMenuHide: true,
    }),
    []
  );

  // Grid options
  const gridOptions: GridOptions = useMemo(
    () => ({
      pagination: true,
      paginationPageSize: 25,
      paginationPageSizeSelector: [25, 50, 100],
      enableRangeSelection: true,
      rowSelection: "multiple",
      animateRows: true,
    }),
    []
  );

  // Hide the id column if present
  const processedColumns: ColDef[] = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        hide: col.field === "id" ? true : !!col.hide,
      })),
    [columns]
  );

  // onGridReady
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
  }, []);

  // CSS variables for theming (type-safe-ish)
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
        height: "calc(100vh - 100px)",
        overflow: "auto",
        paddingRight: "5px",
        boxSizing: "border-box",
      }}
    >
      <div
        className={isDarkMode ? "ag-theme-alpine-dark" : "ag-theme-alpine"}
        style={{ width: "100%", ...themeVars }}
      >
        <AgGridReact
          rowData={rows}
          columnDefs={processedColumns}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          loadingOverlayComponent={LoadingOverlayComponent}
          rowGroupPanelShow={"always"}
          sideBar={sideBarConfig}
          suppressDragLeaveHidesColumns={true}
        />
      </div>
    </div>
  );
};

export default AGGrid;
