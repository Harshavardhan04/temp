import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef } from "ag-grid-community";

interface RowData {
  scenario: string;
  shockedRiskFactor: string;
  shocks: string;
  portfolios?: { portfolio: string; value: string }[]; // detail data
}

const GridWithDetail: React.FC = () => {
  const [rowData] = useState<RowData[]>([
    {
      scenario: "PE",
      shockedRiskFactor: "EURCcy",
      shocks: "-20%",
      portfolios: [
        { portfolio: "Portfolio A", value: "100m" },
        { portfolio: "Portfolio B", value: "80m" }
      ]
    },
    {
      scenario: "Others",
      shockedRiskFactor: "USDCcy",
      shocks: "+10%",
      portfolios: [
        { portfolio: "Portfolio X", value: "50m" },
        { portfolio: "Portfolio Y", value: "30m" }
      ]
    }
  ]);

  const [columnDefs] = useState<ColDef[]>([
    { field: "scenario", headerName: "Scenario" },
    { field: "shockedRiskFactor", headerName: "Shocked Risk Factor" },
    { field: "shocks", headerName: "Shocks" }
  ]);

  return (
    <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
      <AgGridReact<RowData>
        rowData={rowData}
        columnDefs={columnDefs}
        masterDetail={true}
        detailCellRendererParams={{
          detailGridOptions: {
            columnDefs: [
              { field: "portfolio", headerName: "Portfolio" },
              { field: "value", headerName: "Value" }
            ]
          },
          getDetailRowData: (params) => {
            params.successCallback(params.data.portfolios || []);
          }
        }}
        onRowDoubleClicked={(params) => {
          if (params.node.master) {
            params.node.setExpanded(!params.node.expanded);
          }
        }}
      />
    </div>
  );
};

export default GridWithDetail;
