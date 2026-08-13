import en from "../en/auth";
import type { TranslationShape } from "../types";

const th = {
	errors: {
		loginFailed: "เข้าสู่ระบบไม่สำเร็จ",
	},
	login: {
		success: "ยินดีต้อนรับกลับ คุณเข้าสู่ระบบแล้ว",
		invalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง",
	},
} as const satisfies TranslationShape<typeof en>;

export default th;
