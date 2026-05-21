import { fetchApi } from "./api";

export interface SendNotificationParams {
	title: string;
	message: string;
	userId: string;
}

export interface NotificationResponse {
	id: string;
	userId: string;
	title: string;
	message: string;
	createdAt: number;
}

class NotificationService {
	async sendNotification(params: SendNotificationParams): Promise<{
		success: boolean;
		data?: NotificationResponse;
		error?: string;
	}> {
		const response = await fetchApi<NotificationResponse>(
			"/notifications/send",
			{
				method: "POST",
				body: params,
			}
		);

		return response;
	}

	async sendNotificationToMultiple(
		title: string,
		message: string,
		userIds: string[]
	): Promise<{ success: boolean; errors: string[] }> {
		const errors: string[] = [];

		await Promise.all(
			userIds.map(async (userId) => {
				const result = await this.sendNotification({
					title,
					message,
					userId,
				});
				if (!result.success) {
					errors.push(`Failed to send to user ${userId}: ${result.error}`);
				}
			})
		);

		return {
			success: errors.length === 0,
			errors,
		};
	}
}

export const notificationService = new NotificationService();