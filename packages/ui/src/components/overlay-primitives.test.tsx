import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ResponsiveDrawer } from "./responsive-drawer";

function DialogHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button onClick={() => setOpen(true)} ref={triggerRef} type="button">
        Open dialog
      </button>
      <button type="button">Outside dialog</button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent finalFocus={triggerRef} initialFocus={cancelRef} showCloseButton={false}>
          <DialogTitle>Confirm change</DialogTitle>
          <DialogDescription>Changes are saved immediately.</DialogDescription>
          <DialogClose render={<button ref={cancelRef} type="button" />}>
            Cancel
          </DialogClose>
          <button type="button">Confirm</button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  const [nestedOpen, setNestedOpen] = useState(false);
  const nestedTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Open base drawer
      </button>
      <ResponsiveDrawer
        onOpenChange={setOpen}
        open={open}
        title="base drawer"
      >
        <Popover>
          <PopoverTrigger>Open drawer popover</PopoverTrigger>
          <PopoverContent>Drawer portal content</PopoverContent>
        </Popover>
        <button
          onClick={() => setNestedOpen(true)}
          ref={nestedTriggerRef}
          type="button"
        >
          Open nested drawer
        </button>
        <button type="button">Drawer action</button>
        <ResponsiveDrawer
          layer="nested"
          onOpenChange={setNestedOpen}
          onCloseAutoFocus={() => nestedTriggerRef.current?.focus()}
          open={nestedOpen}
          title="nested drawer"
        >
          <button type="button">Nested drawer action</button>
        </ResponsiveDrawer>
      </ResponsiveDrawer>
    </>
  );
}

describe("Animate UI overlay wrappers", () => {
  it("traps dialog focus and restores final focus after cancellation", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Confirm change" });
    await waitFor(() => expect(dialog).toBeVisible());
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();
    await user.tab();
    const outside = screen.getByText("Outside dialog", { selector: "button" });
    expect(outside.parentElement).toHaveAttribute("data-base-ui-inert", "");
    expect(outside).not.toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("keeps drawer portal content usable and closes a nested drawer without closing its parent", async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);

    await user.click(screen.getByRole("button", { name: "Open base drawer" }));
    const [basePopup] = await screen.findAllByRole("dialog");
    await waitFor(() => expect(basePopup).toBeVisible());
    await waitFor(() => expect(basePopup).toHaveFocus());

    await user.click(within(basePopup).getByRole("button", { name: "Open drawer popover" }));
    const popover = await screen.findByText("Drawer portal content");
    expect(basePopup).toContainElement(popover);

    const nestedTrigger = within(basePopup).getByRole("button", {
      name: "Open nested drawer",
    });
    await user.click(nestedTrigger);
    const nestedPopup = await screen.findByRole("dialog", { name: "nested drawer" });
    expect(nestedPopup).toBeVisible();
    const nestedBackdrop = document.querySelector(
      '[data-slot="drawer-backdrop"]:not([data-animate-ui-drawer])',
    );
    expect(nestedBackdrop).toBeInTheDocument();

    fireEvent.pointerDown(nestedBackdrop!);
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "nested drawer" }),
      ).not.toBeInTheDocument(),
    );
    expect(basePopup).toBeVisible();
    await waitFor(() => expect(nestedTrigger).toHaveFocus());
  });
});
