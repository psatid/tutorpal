import { Menu, PanelLeftClose, PanelRightClose } from "lucide-react";
import { triggerEdgeCollapse, triggerEdgeDrawer } from "tailwindcss-jun-layout";
import { useTranslation } from "react-i18next";

export const TriggerMobileSidebar = () => {
  const { t } = useTranslation("common");

  return (
    <button
      aria-label={t("accessibility.toggleSidebar")}
      className="jun-edgeDrawerTrigger"
      onClick={() => triggerEdgeDrawer()}
    >
      <Menu className="h-5 w-5" />
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
      <PanelLeftClose className="jun-edgeUncollapsed-visible" />
      <PanelRightClose className="jun-edgeCollapsed-visible" />
    </button>
  );
};
