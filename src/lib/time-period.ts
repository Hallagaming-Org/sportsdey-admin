const DAY_MS = 86400000;

// Returns the start-of-day (UTC) Date for the given period label
export const getFromDateForPeriod = (period: string): Date | undefined => {
	const today = new Date();
	// normalize to UTC start of today
	today.setUTCHours(0, 0, 0, 0);

	switch (period) {
		case "Today":
			return today;

		case "Yesterday": {
			const d = new Date(today);
			d.setUTCDate(d.getUTCDate() - 1);
			return d;
		}

		case "3 days ago": {
			const d = new Date(today);
			d.setUTCDate(d.getUTCDate() - 3);
			return d;
		}

		case "A week ago":
		case "Last week": {
			const d = new Date(today);
			d.setUTCDate(d.getUTCDate() - 7);
			return d;
		}

		case "A month ago":
		case "Last month": {
			const d = new Date(today);
			d.setUTCMonth(d.getUTCMonth() - 1);
			return d;
		}

		default:
			return undefined;
	}
};

export const getDateRangeForPeriod = (
	period: string,
	customRange?: { start: string; end: string },
	options?: { output?: "iso" | "date" },
): { fromDate?: string; toDate?: string } => {
	const toISOStringWithTime = (d: Date) => d.toISOString();
	const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);
	const fmt = options?.output === "date" ? toDateOnly : toISOStringWithTime;

	const startOfDay = (d: Date) => {
		const dt = new Date(d);
		dt.setUTCHours(0, 0, 0, 0);
		return dt;
	};

	const endOfDay = (d: Date) => {
		const dt = new Date(d);
		dt.setUTCHours(23, 59, 59, 999);
		return dt;
	};

	if (period === "Custom") {
		if (!customRange?.start || !customRange?.end) return {};
  
		const parsedStart = new Date(customRange.start);
		const parsedEnd = new Date(customRange.end);
		if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) return {};
		const start = startOfDay(parsedStart);
		const end = endOfDay(parsedEnd);
		return {
			fromDate: fmt(start),
			toDate: fmt(end),
		};
	}

	if (period === "All") return {};

	const from = getFromDateForPeriod(period);
	if (!from) return {};

	// For preset periods (non-Custom), only include fromDate — APIs expect only fromDate
	return {
		fromDate: fmt(startOfDay(from)),
	};
};
