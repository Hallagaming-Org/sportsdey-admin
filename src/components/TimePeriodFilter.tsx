import { useState, useRef, useEffect } from "react";
import { IoFilter } from "react-icons/io5";

export type TimePeriod = "All" | "Today" | "Yesterday" | "Last week" | "Last month" | "Custom";

interface TimePeriodFilterProps {
	onFilterChange?: (period: TimePeriod, customRange?: { start: string; end: string }) => void;
	buttonClassName?: string;
}

export function TimePeriodFilter({ onFilterChange, buttonClassName }: TimePeriodFilterProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selected, setSelected] = useState<TimePeriod | null>(null);
	const [showCustom, setShowCustom] = useState(false);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				// Reset custom view if closed without applying
				if (showCustom && selected !== "Custom") {
					setShowCustom(false);
				}
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showCustom, selected]);

	const handleSelect = (period: TimePeriod) => {
		if (period === "Custom") {
			setShowCustom(true);
		} else if (period === "All") {
			setSelected(null);
			setIsOpen(false);
			setShowCustom(false);
			onFilterChange?.(period);
		} else {
			setSelected(period);
			setIsOpen(false);
			setShowCustom(false);
			onFilterChange?.(period);
		}
	};

	const handleCustomApply = () => {
		setSelected("Custom");
		setIsOpen(false);
		onFilterChange?.("Custom", { start: startDate, end: endDate });
	};

	const defaultButtonClass = "flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50";

	return (
		<div className="relative" ref={dropdownRef}>
			<button 
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={buttonClassName || defaultButtonClass}
			>
				<span className="hidden lg:block">
					{selected === "Custom" && startDate && endDate 
						? `${startDate} - ${endDate}` 
						: selected || "Time periods"}
				</span>
				<IoFilter className="h-3.5 w-3.5" />
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-[0_4px_20px_0_#0000000F] z-50">
					{!showCustom ? (
						<div className="flex flex-col gap-0.5">
							{(["All", "Today", "Yesterday", "Last week", "Last month", "Custom"] as TimePeriod[]).map((p) => (
								<button 
									key={p} 
									type="button"
									onClick={() => handleSelect(p)}
									className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${
										selected === p ? "bg-[#1BAA04]/10 text-[#1BAA04] font-medium" : "text-gray-700 hover:bg-gray-50 font-medium"
									}`}
								>
									{p}
								</button>
							))}
						</div>
					) : (
						<div className="p-3 flex flex-col gap-4">
							<h4 className="text-sm font-bold text-gray-900">Custom Range</h4>
							<div className="flex flex-col gap-3">
								<div className="flex flex-col gap-1.5">
									<label className="text-xs text-gray-500 font-medium">Start Date</label>
									<input 
										type="date" 
										value={startDate} 
										onChange={(e) => setStartDate(e.target.value)} 
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1BAA04] focus:ring-1 focus:ring-[#1BAA04] transition-all" 
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label className="text-xs text-gray-500 font-medium">End Date</label>
									<input 
										type="date" 
										value={endDate} 
										min={startDate}
										onChange={(e) => setEndDate(e.target.value)} 
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1BAA04] focus:ring-1 focus:ring-[#1BAA04] transition-all" 
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
									className="flex-1 rounded-lg bg-[#1BAA04] py-2 text-xs font-medium text-white hover:bg-[#0ea800] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
