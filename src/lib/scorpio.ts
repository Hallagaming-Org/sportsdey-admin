import { fetchApi } from "./api";

export type ScorpioProvider = {
	providerId: number;
	providerName: string;
	status?: number;
};

export type ScorpioRemoteGame = {
	gameID?: string;
	gameCode?: string;
	gameName?: string;
	gameImage?: string | Record<string, unknown>;
	gameType?: number;
	inMaintenance?: boolean;
	status?: number;
	enabled?: boolean;
};

export type ScorpioCatalogGame = {
	providerId: number;
	providerName: string;
	gameId: string;
	name: string;
	imageUrl: string | null;
	inMaintenance: boolean;
	enabled: boolean;
};

export function scorpioLocalCode(providerId: number, gameId: string): string {
	return `scorpio:${providerId}:${gameId}`;
}

export function isScorpioLocalCode(code: string): boolean {
	return code.startsWith("scorpio:");
}

export function resolveScorpioGameId(game: ScorpioRemoteGame): string | null {
	const raw = game.gameID || game.gameCode;
	if (raw == null) return null;
	const code = String(raw).trim();
	return code || null;
}

/** Normalize Scorpio thumbnail: plain URL string or nested provider image map. */
export function resolveScorpioImage(
	gameImage: ScorpioRemoteGame["gameImage"],
): string | null {
	if (typeof gameImage === "string") {
		const trimmed = gameImage.trim();
		return trimmed || null;
	}
	if (!gameImage || typeof gameImage !== "object") return null;

	const img = gameImage as {
		mobile?: {
			squareTile?: string;
			icon?: { small?: string; medium?: string };
			verticalTile?: { small?: string; large?: string };
		};
		desktop?: {
			landscapeTile?: string;
			gameCover?: string;
			banner?: { small?: string; medium?: string };
		};
	};
	const candidates = [
		img.mobile?.squareTile,
		img.mobile?.icon?.medium,
		img.mobile?.icon?.small,
		img.desktop?.landscapeTile,
		img.desktop?.gameCover,
		img.desktop?.banner?.medium,
		img.desktop?.banner?.small,
		img.mobile?.verticalTile?.small,
	];
	for (const candidate of candidates) {
		if (typeof candidate === "string" && candidate.trim()) {
			return candidate.trim();
		}
	}
	return null;
}

export async function listScorpioProviders(): Promise<{
	success: boolean;
	data?: ScorpioProvider[];
	error?: string;
}> {
	return fetchApi<ScorpioProvider[]>("/scorpio/providers");
}

export async function listScorpioProviderGames(providerId: number): Promise<{
	success: boolean;
	data?: ScorpioRemoteGame[];
	error?: string;
}> {
	return fetchApi<ScorpioRemoteGame[]>(`/scorpio/games/${providerId}`);
}

export async function fetchScorpioCatalog(): Promise<{
	success: boolean;
	data?: ScorpioCatalogGame[];
	error?: string;
}> {
	const providersRes = await listScorpioProviders();
	if (!providersRes.success || !providersRes.data) {
		return {
			success: false,
			error: providersRes.error || "Failed to fetch Scorpio providers",
		};
	}

	const active = providersRes.data.filter((provider) => provider.status !== 0);
	const lists = await Promise.all(
		active.map(async (provider) => {
			const res = await listScorpioProviderGames(provider.providerId);
			if (!res.success || !res.data) return [] as ScorpioCatalogGame[];

			const mapped: ScorpioCatalogGame[] = [];
			for (const game of res.data) {
				const gameId = resolveScorpioGameId(game);
				const name =
					typeof game.gameName === "string" ? game.gameName.trim() : "";
				if (!gameId || !name) continue;
				mapped.push({
					providerId: provider.providerId,
					providerName: provider.providerName,
					gameId,
					name,
					imageUrl: resolveScorpioImage(game.gameImage),
					inMaintenance: game.inMaintenance === true,
					enabled:
						game.enabled !== false &&
						game.inMaintenance !== true &&
						game.status !== 0,
				});
			}
			return mapped;
		}),
	);

	return { success: true, data: lists.flat() };
}
