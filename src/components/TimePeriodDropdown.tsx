import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export type TimePeriodOption = "All" | "Today" | "Yesterday" | "3 days ago" | "A week ago" | "A month ago" | "Custom";

interface TimePeriodDropdownProps {
	value: TimePeriodOption;
	onChange: (period: TimePeriodOption, customRange?: { start: string; end: string }) => void;
	buttonClassName?: string;
	showCustomOption?: boolean;
}

const defaultPeriods: TimePeriodOption[] = ["All", "Today", "Yesterday", "3 days ago", "A week ago", "A month ago"];

export function TimePeriodDropdown({
	value,
	onChange,
	buttonClassName,
	showCustomOption = false,
}: TimePeriodDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [showCustom, setShowCustom] = useState(false);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const dropdownRef = useRef<HTMLDivElement>(null);

	const periods = showCustomOption 
		? [...defaultPeriods, "Custom" as TimePeriodOption]
		: defaultPeriods;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				if (showCustom && value !== "Custom") {
					setShowCustom(false);
				}
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showCustom, value]);

	const handleSelect = (period: TimePeriodOption) => {
		if (period === "Custom") {
			setShowCustom(true);
		} else {
			setSelected(period);
			setIsOpen(false);
			setShowCustom(false);
			onChange(period);
		}
	};

	const handleCustomApply = () => {
		setSelected("Custom");
		setIsOpen(false);
		onChange("Custom", { start: startDate, end: endDate });
	};

	const setSelected = (period: TimePeriodOption) => {
		// This is handled by parent via value prop
	};

	const displayText = value === "Custom" && startDate && endDate
		? `${startDate} - ${endDate}`
		: value === "All"
			? "Time periods"
			: value;

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={buttonClassName || "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-white px-4 font-medium text-sm text-[#2B2F38] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"}
			>
				{displayText}
				<SlidersHorizontal className="h-3.5 w-3.5" />
			</button>

			{isOpen && (
				<div className="absolute right-0 top-12 z-40 w-[240px] rounded-2xl bg-[#F3F4F6] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
					{!showCustom ? (
						<>
							<div className="mb-4 flex items-center justify-between">
								<h4 className="font-bold text-[22px] text-[#222]">Pick a date</h4>
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="flex h-7 w-7 items-center justify-center rounded-full border border-[#1F2340] text-[#1F2340]"
								>
									<X className="h-3.5 w-3.5" />
								</button>
							</div>
							<div className="space-y-2">
								{periods.map((period) => (
									<button
										key={period}
										type="button"
										onClick={() => handleSelect(period)}
										className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm ${
											value === period
												? "bg-accent font-semibold text-white"
												: "bg-[#E5E7EB] font-medium text-[#667085]"
										}`}
									>
										{period}
									</button>
								))}
							</div>
						</>
					) : (
						<div className="flex flex-col gap-4">
							<div className="mb-4 flex items-center justify-between">
								<h4 className="font-bold text-[22px] text-[#222]">Custom Range</h4>
								<button
									type="button"
									onClick={() => setShowCustom(false)}
									className="flex h-7 w-7 items-center justify-center rounded-full border border-[#1F2340] text-[#1F2340]"
								>
									<X className="h-3.5 w-3.5" />
								</button>
							</div>
							<div className="flex flex-col gap-3">
								<div className="flex flex-col gap-1.5">
									<label className="text-xs text-gray-500 font-medium">Start Date</label>
									<input
										type="date"
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label className="text-xs text-gray-500 font-medium">End Date</label>
									<input
										type="date"
										value={endDate}
										min={startDate}
										onChange={(e) => setEndDate(e.target.value)}
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
									/>
								</div>
							</div>
							<div className="flex items-center gap-2 mt-1">
								<button
									type="button"
									onClick={() => setShowCustom(false)}
									className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
								>
									Back
								</button>
								<button
									type="button"
									onClick={handleCustomApply}
									disabled={!startDate || !endDate}
									className="flex-1 rounded-lg bg-accent py-2 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Apply
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}