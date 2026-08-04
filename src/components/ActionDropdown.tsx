import { type ReactNode, useEffect, useRef, useState } from "react";

export interface ActionDropdownItem {
	icon: ReactNode;
	label: string;
	onClick: () => void;
	className?: string;
}

interface ActionDropdownProps {
	top: number;
	right: number;
	items: ActionDropdownItem[];
	onClose?: () => void;
}

export function ActionDropdown({ top, right, items, onClose }: ActionDropdownProps) {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [computedTop, setComputedTop] = useState(top + 4);

	useEffect(() => {
		if (dropdownRef.current) {
			const rect = dropdownRef.current.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			if (rect.bottom > windowHeight - 16) {
				const dropdownHeight = rect.height;
				setComputedTop(Math.max(10, top - dropdownHeight - 8));
			} else {
				setComputedTop(top + 4);
			}
		}
	}, [top]);

	return (
		<div
			ref={dropdownRef}
			className="fixed z-100 w-52 rounded-lg bg-white shadow-lg border border-gray-100 py-1"
			style={{ top: computedTop, right: right }}
			onClick={(e) => {
				e.stopPropagation();
				e.nativeEvent.stopImmediatePropagation();
				onClose?.();
			}}
		>
			{items.map((item, idx) => {
				const isDelete = item.label.toLowerCase().includes("delete");
				const defaultTextClass = isDelete 
					? "text-[#B00020] hover:bg-red-50" 
					: "text-gray-700 hover:bg-gray-50";

				return (
					<button
						key={idx}
						className={`w-full px-4 py-2 text-sm text-left flex items-center gap-3 transition-colors cursor-pointer ${defaultTextClass} ${item.className || ""}`}
						onClick={(e) => {
							e.stopPropagation();
							item.onClick();
						}}
					>
						{item.icon}
						{item.label}
					</button>
				);
			})}
		</div>
	);
}
