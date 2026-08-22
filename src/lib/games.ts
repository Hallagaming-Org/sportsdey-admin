import { fetchApi } from "./api";

export interface ApiGame {
  id: string;
  name: string;
  code: string;
  imageUrl: string | null;
  category?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

class GamesService {
  async listGames(): Promise<{
    success: boolean;
    data?: ApiGame[];
    error?: string;
  }> {
    return fetchApi<ApiGame[]>("/games");
  }

  async createGames(
    games: Array<{
      name: string;
      code: string;
      imageUrl?: string | null;
      enabled?: boolean;
    }>,
  ): Promise<{
    success: boolean;
    data?: ApiGame[];
    error?: string;
  }> {
    return fetchApi<ApiGame[]>("/games", {
      method: "POST",
      body: games,
    });
  }

  async toggleGame(
    id: string,
    enable: boolean,
  ): Promise<{
    success: boolean;
    data?: { id: string; enabled: boolean };
    error?: string;
  }> {
    const action = enable ? "enable" : "disable";
    return fetchApi<{ id: string; enabled: boolean }>(
      `/games/${id}/${action}`,
      { method: "PATCH" },
    );
  }
}

export const gamesService = new GamesService();

/** Collapse punctuation so "spin and win" matches `spin_and_win`. */
export function normalizeGameSearch(value: string): string {
	return value
		.toLowerCase()
		.replace(/[_-]+/g, " ")
		.replace(/[^a-z0-9\s]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function gameMatchesQuery(
	game: {
		name: string;
		code: string;
		category?: string | null;
		tagline?: string;
		type?: string;
	},
	query: string,
): boolean {
	const tokens = normalizeGameSearch(query).split(" ").filter(Boolean);
	if (tokens.length === 0) return true;

	const haystack = normalizeGameSearch(
		[game.name, game.code, game.category, game.tagline, game.type]
			.filter((part): part is string => Boolean(part))
			.join(" "),
	);

	return tokens.every((token) => haystack.includes(token));
}
