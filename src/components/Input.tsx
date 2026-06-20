import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "#/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex w-full bg-[#F9F9F9] rounded-md px-3 py-2 text-gray-900 focus:outline-none placeholder:text-gray-500",
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Input.displayName = "Input";
