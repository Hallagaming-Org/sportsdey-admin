import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn(
				"flex h-full w-full flex-col overflow-hidden bg-white text-gray-900",
				className,
			)}
			{...props}
		/>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div
			className="flex items-center gap-2 border-b border-gray-100 px-3"
			data-slot="command-input-wrapper"
		>
			<Search className="h-4 w-4 shrink-0 text-gray-400" />
			<CommandPrimitive.Input
				data-slot="command-input"
				className={cn(
					"h-10 min-w-0 flex-1 bg-transparent text-xs font-medium text-gray-700 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			data-slot="command-list"
			className={cn(
				"max-h-52 overflow-x-hidden overflow-y-auto py-1",
				className,
			)}
			{...props}
		/>
	);
}

function CommandEmpty({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className={cn("px-3.5 py-2 text-xs font-medium text-gray-400", className)}
			{...props}
		/>
	);
}

function CommandItem({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(
				"relative flex cursor-pointer select-none items-center px-3.5 py-2 text-xs font-medium text-gray-700 outline-none data-[selected=true]:bg-gray-50 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Command, CommandEmpty, CommandInput, CommandItem, CommandList };
