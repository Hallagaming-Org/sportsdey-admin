import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Admin } from "../lib/auth";

type HeaderProps = {
	admin?: Admin | null;
};

function gamesQueryFromSearch(search: unknown): string {
	if (!search || typeof search !== "object") return "";
	const q = (search as { q?: unknown }).q;
	return typeof q === "string" ? q : "";
}

export default function Header({ admin }: HeaderProps) {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const locationSearch = useRouterState({ select: (s) => s.location.search });
	const isGamesPage = pathname === "/app/games";
	const urlQuery = isGamesPage ? gamesQueryFromSearch(locationSearch) : "";
	const [query, setQuery] = useState(urlQuery);

	useEffect(() => {
		setQuery(isGamesPage ? urlQuery : "");
	}, [isGamesPage, urlQuery]);

	const applyGamesSearch = (value: string) => {
		setQuery(value);
		if (!isGamesPage) return;
		void navigate({
			to: "/app/games",
			search: value.trim() ? { q: value } : {},
			replace: true,
		});
	};

	return (
		<header className="flex h-16 shrink-0 items-center gap-6 bg-black px-6 text-white print:hidden">
			<div className="flex flex-1 justify-center">
				<search className="relative w-full max-w-[480px]">
					<form
						className="flex h-10 w-full items-center rounded-full border border-white/10 bg-white px-4"
						onSubmit={(event) => event.preventDefault()}
					>
						<input
							type="text"
							value={query}
							onChange={(event) => applyGamesSearch(event.target.value)}
							placeholder={
								isGamesPage ? "Search games..." : "Search all files..."
							}
							aria-label={isGamesPage ? "Search games" : "Search"}
							autoComplete="off"
							spellCheck={false}
							maxLength={80}
							disabled={!isGamesPage}
							className="flex-1 border-none bg-transparent p-0 text-primary/80 text-sm outline-none disabled:cursor-not-allowed"
						/>
						{isGamesPage && query ? (
							<button
								type="button"
								onClick={() => applyGamesSearch("")}
								className="mr-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary/60 hover:bg-black/5 hover:text-primary"
								aria-label="Clear search"
							>
								<X size={14} />
							</button>
						) : null}
						<Search size={18} className="ml-1 shrink-0 text-primary/80" />
					</form>
				</search>
			</div>

			<div className="flex shrink-0 items-center gap-4">
				<button
					type="button"
					className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-white/05 text-white transition-colors duration-180 hover:bg-white/12"
				>
					<Bell size={20} />
				</button>

				<div className="flex cursor-pointer items-center gap-1.5">
					{admin ? (
						<>
							<img
								src={admin.image || "https://i.pravatar.cc/40"}
								alt="Admin avatar"
								className="h-9 w-9 rounded-full object-cover"
							/>
							<ChevronDown size={14} className="text-white/60" />
						</>
					) : (
						<div className="flex items-center gap-1.5">
							<div className="h-9 w-9 animate-pulse rounded-full bg-white/20" />
							<ChevronDown size={14} className="text-white/20" />
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
