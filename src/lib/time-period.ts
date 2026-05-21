const DAY_MS = 86400000;

export const getFromDateForPeriod = (period: string): Date | undefined => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	switch (period) {
		case "Today":
			return today;

		case "Yesterday": {
			const d = new Date(today);
			d.setDate(d.getDate() - 1);
			return d;
		}

		case "3 days ago": {
			const d = new Date(today);
			d.setDate(d.getDate() - 3);
			return d;
		}

		case "A week ago": {
			const d = new Date(today);
			d.setDate(d.getDate() - 7);
			return d;
		}

		case "A month ago": {
			const d = new Date(today);
			d.setMonth(d.getMonth() - 1);
			return d;
		}

		default:
			return undefined;
	}
};

export const getDateRangeForPeriod = (
	period: string,
	customRange?: { start: string; end: string },
): { fromDate?: string; toDate?: string } => {
	if (period === "Custom") {
		return {
			fromDate: customRange?.start,
			toDate: customRange?.end,
		};
	}

	if (period === "All") return {};

	const from = getFromDateForPeriod(period);

	console.log("from", from);

	return {
		fromDate: from?.toISOString(),
		// toDate: new Date().toISOString(),
	};
};
