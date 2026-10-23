import en from "../en/navigation";
import type { TranslationShape } from "../types";

const th = {
	userManagement: "จัดการผู้ใช้",
	primaryNavigation: "การนำทางหลัก",
} as const satisfies TranslationShape<typeof en>;

export default th;
