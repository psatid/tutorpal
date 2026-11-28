import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DataTable } from "./data-table";

type Student = {
  id: string;
  name: string;
  score: number;
};

const students: Student[] = [
  { id: "student-aria", name: "Aria", score: 91 },
  { id: "student-ben", name: "Ben", score: 74 },
  { id: "student-zoe", name: "Zoe", score: 86 },
];

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filterFns: { includesString: filterFn_includesString },
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { text: sortFn_text },
  sortedRowModel: createSortedRowModel(),
});

const columns: ColumnDef<typeof features, Student>[] = [
  {
    header: "Student details",
    id: "details",
    columns: [
      {
        accessorKey: "name",
        cell: ({ getValue }) => <strong>Student: {String(getValue())}</strong>,
        filterFn: "includesString",
        header: ({ column }) => (
          <button onClick={() => column.toggleSorting()} type="button">
            Name
          </button>
        ),
        sortFn: "text",
      },
      {
        accessorKey: "score",
        header: "Score",
      },
    ],
  },
  {
    header: "Selection",
    id: "selection",
    cell: ({ row }) => (
      <button onClick={() => row.toggleSelected()} type="button">
        {row.getIsSelected() ? `Deselect ${row.original.name}` : `Select ${row.original.name}`}
      </button>
    ),
  },
];

function StudentTableFixture() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 2 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  return (
    <>
      <label>
        Filter students
        <input
          onChange={(event) => {
            setColumnFilters(event.target.value ? [{ id: "name", value: event.target.value }] : []);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
          value={String(columnFilters[0]?.value ?? "")}
        />
      </label>
      <button onClick={() => setColumnVisibility({ score: false })} type="button">
        Hide score
      </button>
      <button onClick={() => setPagination((current) => ({ ...current, pageIndex: 1 }))} type="button">
        Next page
      </button>
      <DataTable
        ariaLabel="Students"
        config={{
          columns,
          data: students,
          enableRowSelection: true,
          features,
          getRowId: (student) => student.id,
          onColumnFiltersChange: setColumnFilters,
          onColumnVisibilityChange: setColumnVisibility,
          onPaginationChange: setPagination,
          onRowSelectionChange: setRowSelection,
          onSortingChange: setSorting,
          state: { columnFilters, columnVisibility, pagination, rowSelection, sorting },
        }}
      />
    </>
  );
}

describe("DataTable", () => {
  it("renders grouped native v9 columns while reacting to sorting, visibility, selection, pagination, and filtering", async () => {
    const user = userEvent.setup();
    render(<StudentTableFixture />);

    const table = screen.getByRole("table", { name: "Students" });
    const detailsHeader = screen.getByRole("columnheader", { name: "Student details" });

    expect(detailsHeader).toHaveAttribute("scope", "colgroup");
    expect(detailsHeader).toHaveAttribute("colspan", "2");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("scope", "col");
    expect(screen.getByText("Student: Aria")).toBeVisible();
    expect(screen.getByText("Student: Ben")).toBeVisible();
    expect(screen.queryByText("Student: Zoe")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Name" }));

    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByText("Student: Aria")).toBeVisible();
    expect(screen.getByText("Student: Ben")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Select Aria" }));

    expect(screen.getByText("Student: Aria").closest("tr")).toHaveAttribute("data-state", "selected");

    await user.click(screen.getByRole("button", { name: "Hide score" }));

    expect(screen.queryByRole("columnheader", { name: "Score" })).not.toBeInTheDocument();
    expect(detailsHeader).toHaveAttribute("colspan", "1");
    expect(screen.getByText("Student: Aria").closest("tr")?.cells).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.queryByText("Student: Aria")).not.toBeInTheDocument();
    expect(screen.getByText("Student: Zoe")).toBeVisible();

    await user.type(screen.getByRole("textbox", { name: "Filter students" }), "missing");

    const emptyCell = screen.getByText("No results.").closest("td");
    expect(emptyCell).toHaveAttribute("colspan", "2");
    expect(within(table).queryByRole("button", { name: /Select|Deselect/ })).not.toBeInTheDocument();
  });

  it("uses caller-provided empty content instead of the localized fallback", () => {
    render(
      <DataTable
        ariaLabel="Empty students"
        config={{ columns, data: [], features }}
        emptyContent={<span>No enrolled students</span>}
      />,
    );

    expect(screen.getByRole("table", { name: "Empty students" })).toBeVisible();
    expect(screen.getByText("No enrolled students")).toBeVisible();
    expect(screen.queryByText("No results.")).not.toBeInTheDocument();
  });
});
