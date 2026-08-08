import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export type WorkspaceControlChoice<T extends string = string> = {
  value: T;
  label: string;
};

type WorkspaceControlSelectProps<T extends string> = {
  label: string;
  choice: WorkspaceControlChoice<T>;
  choices: readonly WorkspaceControlChoice<T>[];
  onValueChange: (value: T) => void;
  disabled?: boolean;
  isActive?: boolean;
  icon: typeof ArrowUpDown;
};

type WorkspaceSearchControlsProps<
  SortValue extends string,
  FilterValue extends string = string,
> = {
  search: string;
  searchLabel: string;
  searchPlaceholder: string;
  clearSearchLabel: string;
  onSearchChange: (value: string) => void;
  sortLabel: string;
  sort: WorkspaceControlChoice<SortValue>;
  sortChoices: readonly WorkspaceControlChoice<SortValue>[];
  onSortChange: (value: SortValue) => void;
  filter?: {
    label: string;
    value: WorkspaceControlChoice<FilterValue>;
    choices: readonly WorkspaceControlChoice<FilterValue>[];
    onValueChange: (value: FilterValue) => void;
    disabled?: boolean;
    isActive?: boolean;
  };
  resetLabel: string;
  onReset: () => void;
  isDirty: boolean;
};

function WorkspaceControlSelect<T extends string>({
  label,
  choice,
  choices,
  onValueChange,
  disabled = false,
  isActive = false,
  icon: Icon,
}: WorkspaceControlSelectProps<T>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const valueContent = (
    <>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="shrink-0 font-medium">{label}:</span>
      <span className="min-w-0 truncate">{choice.label}</span>
    </>
  );

  function selectChoice(nextValue: T) {
    onValueChange(nextValue);
    setIsOpen(false);
  }

  if (!isDesktop) {
    return (
      <>
        <Button
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={`${label}: ${choice.label}`}
          aria-pressed={isActive}
          className="w-auto max-w-52 shrink-0"
          data-active={isActive ? "true" : undefined}
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          ref={triggerRef}
          type="button"
          variant="outline"
          size="sm"
        >
          {valueContent}
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </Button>
        <ResponsiveDrawer
          onCloseAutoFocus={() => triggerRef.current?.focus()}
          onOpenChange={setIsOpen}
          open={isOpen}
          title={label}
        >
          <div className="flex flex-col gap-2">
            {choices.map((option) => {
              const isSelected = option.value === choice.value;

              return (
                <Button
                  aria-pressed={isSelected}
                  className={cn(
                    "w-full justify-between text-left whitespace-normal",
                    isSelected &&
                      `bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary-foreground
					  border-primary dark:border-primary-foreground`,
                  )}
                  key={option.value}
                  onClick={() => selectChoice(option.value)}
                  type="button"
                  variant="outline"
                >
                  <span className="min-w-0 text-left">{option.label}</span>
                  {isSelected ? (
                    <Check aria-hidden="true" className="size-4 shrink-0" />
                  ) : null}
                </Button>
              );
            })}
          </div>
        </ResponsiveDrawer>
      </>
    );
  }

  return (
    <Select
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange(nextValue as T);
      }}
      value={choice.value}
    >
      <SelectTrigger
        aria-label={`${label}: ${choice.label}`}
        className="w-auto max-w-52 shrink-0"
        data-active={isActive ? "true" : undefined}
        size="sm"
      >
        <SelectValue>{valueContent}</SelectValue>
      </SelectTrigger>
      <SelectContent className="w-auto min-w-(--anchor-width) max-w-[calc(100vw-2rem)]">
        <SelectGroup>
          {choices.map((choice) => (
            <SelectItem
              className="whitespace-normal [&>span]:whitespace-normal"
              key={choice.value}
              value={choice.value}
            >
              {choice.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function WorkspaceSearchControls<
  SortValue extends string,
  FilterValue extends string = string,
>({
  search,
  searchLabel,
  searchPlaceholder,
  clearSearchLabel,
  onSearchChange,
  sortLabel,
  sort,
  sortChoices,
  onSortChange,
  filter,
  resetLabel,
  onReset,
  isDirty,
}: WorkspaceSearchControlsProps<SortValue, FilterValue>) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  function clearSearch() {
    onSearchChange("");
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="w-full">
        <Input
          aria-label={searchLabel}
          leftIcon={Search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          ref={searchInputRef}
          rightAdornment={
            search ? (
              <Button
                aria-label={clearSearchLabel}
                onClick={clearSearch}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            ) : null
          }
          value={search}
        />
      </div>
      <div className="workspace-refinement-rail overflow-x-auto overscroll-x-contain">
        <div className="flex w-max min-w-full items-center gap-2 pb-1">
          {filter ? (
            <WorkspaceControlSelect
              choices={filter.choices}
              icon={SlidersHorizontal}
              label={filter.label}
              onValueChange={filter.onValueChange}
              isActive={filter.isActive}
              disabled={filter.disabled}
              choice={filter.value}
            />
          ) : null}
          <WorkspaceControlSelect
            choices={sortChoices}
            icon={ArrowUpDown}
            label={sortLabel}
            onValueChange={onSortChange}
            choice={sort}
          />
          {isDirty ? (
            <Button onClick={onReset} type="button" variant="link">
              {resetLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
