import {
  useTable,
  type Cell,
  type Row,
  type RowData,
  type TableFeatures,
  type TableOptions,
} from "@tanstack/react-table"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { cn } from "../lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

export type DataTableProps<TFeatures extends TableFeatures, TData extends RowData> = {
  config: TableOptions<TFeatures, TData>
  ariaLabel: string
  className?: string
  emptyContent?: React.ReactNode
}

type VisibilityAwareRow<TFeatures extends TableFeatures, TData extends RowData> = Row<TFeatures, TData> & {
  getVisibleCells?: () => Array<Cell<TFeatures, TData, unknown>>
}

type SelectableRow = {
  getIsSelected?: () => boolean
}

type SortableColumn = {
  getIsSorted?: () => "asc" | "desc" | false
}

function getCells<TFeatures extends TableFeatures, TData extends RowData>(
  row: VisibilityAwareRow<TFeatures, TData>
) {
  return row.getVisibleCells?.() ?? row.getAllCells()
}

function getAriaSort(column: SortableColumn): "ascending" | "descending" | undefined {
  const sorting = column.getIsSorted?.()

  if (sorting === "asc") {
    return "ascending"
  }

  if (sorting === "desc") {
    return "descending"
  }

  return undefined
}

function DataTable<TFeatures extends TableFeatures, TData extends RowData>({
  config,
  ariaLabel,
  className,
  emptyContent,
}: DataTableProps<TFeatures, TData>) {
  const { t } = useTranslation("common")
  const table = useTable(config)
  const rows = table.getRowModel().rows
  const visibilityTable = table as typeof table & { getVisibleLeafColumns?: () => Array<unknown> }
  const columnCount = Math.max(visibilityTable.getVisibleLeafColumns?.().length ?? table.getAllLeafColumns().length, 1)

  return (
    <div data-slot="data-table" className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <Table aria-label={ariaLabel}>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  scope={header.subHeaders.length > 0 ? "colgroup" : "col"}
                  aria-sort={
                    header.isPlaceholder || header.subHeaders.length > 0
                      ? undefined
                      : getAriaSort(header.column as SortableColumn)
                  }
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? rows.map((row) => (
            <TableRow key={row.id} data-state={(row as SelectableRow).getIsSelected?.() ? "selected" : undefined}>
              {getCells(row).map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                {emptyContent ?? t("dataTable.noResults")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export { DataTable }
