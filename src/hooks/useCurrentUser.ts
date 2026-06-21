import { useMemo } from "react";
import { getCookie } from "../lib/api";
import type { Admin } from "../lib/auth";

export function useCurrentUser(): Admin | null {
	return useMemo(() => {
		const cookieData = getCookie("admin_user_details");
		if (!cookieData) return null;
		try {
			const parsed = JSON.parse(decodeURIComponent(cookieData));
			return parsed?.admin || parsed;
		} catch (e) {
			return null;
		}
	}, []);
}
