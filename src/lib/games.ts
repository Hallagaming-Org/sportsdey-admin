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
