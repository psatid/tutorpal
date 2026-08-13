import en from "../en/settings";
import type { TranslationShape } from "../types";

const th = {
	logout: "ออกจากระบบ",
	language: "Language / ภาษา",
	logoutSuccess: "คุณออกจากระบบแล้ว",
	logoutError: "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
} as const satisfies TranslationShape<typeof en>;

export default th;
