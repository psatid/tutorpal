import { HugeiconsIcon } from "@hugeicons/react";
import {
  PanelLeftCloseIcon as PanelLeftCloseHugeIcon,
  PanelRightCloseIcon as PanelRightCloseHugeIcon,
  SquareArrowRight01Icon as SquareChevronRightIconHugeIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { triggerEdgeCollapse, triggerEdgeDrawer } from "tailwindcss-jun-layout";

export const TriggerMobileSidebar = () => {
  const { t } = useTranslation("common");

  return (
    <button
      aria-label={t("accessibility.toggleSidebar")}
      className="jun-edgeDrawerTrigger"
      onClick={() => triggerEdgeDrawer()}
    >
      <HugeiconsIcon icon={SquareChevronRightIconHugeIcon} strokeWidth={2} aria-hidden="true" className="h-5 w-5" />
    </button>
  );
};

export const RailCollapse = () => {
  const { t } = useTranslation("common");

  return (
    <button
      className="jun-sidebarRail jun-edgeCollapseTrigger"
      aria-label={t("accessibility.toggleSidebar")}
      tabIndex={-1}
      onClick={(event) => triggerEdgeCollapse({ event })}
      title={t("accessibility.toggleSidebar")}
    />
  );
};

export const TriggerLeftSidebarCollapse = () => {
  const { t } = useTranslation("common");

  return (
    <button
      className="jun-edgeCollapseTrigger cursor-pointer"
      aria-label={t("accessibility.toggleSidebar")}
      onClick={(event) => triggerEdgeCollapse({ event })}
      title={t("accessibility.toggleSidebar")}
    >
      <HugeiconsIcon icon={PanelLeftCloseHugeIcon} strokeWidth={2} aria-hidden="true" className="jun-edgeUncollapsed-visible" />
      <HugeiconsIcon icon={PanelRightCloseHugeIcon} strokeWidth={2} aria-hidden="true" className="jun-edgeCollapsed-visible" />
    </button>
  );
};
