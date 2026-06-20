import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "#/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary placeholder:text-gray-500",
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Input.displayName = "Input";
