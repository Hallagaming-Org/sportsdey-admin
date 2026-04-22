import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { adminAuth } from "../lib/auth";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/sign-in")({
	component: SignInPage,
});

function SignInPage() {
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const signInMutation = useMutation({
		mutationFn: ({
			email,
			password,
		}: {
			email: string;
			password: string;
		}) => adminAuth.signIn(email, password),

		onSuccess: (result) => {

			if (result.success && result.data) {
				navigate({
					to: "/app",
					replace: true,
				});

				return;
			}

			setError(result.error || "Invalid credentials");
		},

		onError: () => {
			setError("An error occurred. Please try again.");
		},
	});

	function handleLogin() {
		setError("");

		if (!email || !password) {
			setError("Please enter email and password");
			return;
		}

		signInMutation.mutate({
			email,
			password,
		});
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="w-full max-w-lg space-y-6 rounded-lg bg-white p-10 shadow-md">
				<div>
					<h1 className="font-bold text-2xl">
						Sign in to your account
					</h1>
				</div>

				<div className="space-y-4">
					{error && (
						<div className="rounded-md bg-red-50 p-3 text-red-600 text-sm">
							{error}
						</div>
					)}

					<div>
						<label
							htmlFor="email"
							className="block font-medium text-gray-700 text-sm"
						>
							Email
						</label>

						<input
							id="email"
							type="text"
							autoComplete="off"
							value={email}
							onChange={(e) =>
								setEmail(e.target.value)
							}
							required
							placeholder="admin@sportsdey.com"
							className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block font-medium text-gray-700 text-sm"
						>
							Password
						</label>

						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) =>
								setPassword(e.target.value)
							}
							required
							placeholder="Enter your password"
							className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
						/>

						<div className="mt-2 text-right">
							<a
								href="#"
								className="text-sm font-medium text-accent hover:underline"
								onClick={(e) =>
									e.preventDefault()
								}
							>
								Forgot password?
							</a>
						</div>
					</div>

					<button
						type="button"
						onClick={handleLogin}
						disabled={signInMutation.isPending}
						className={cn(
							"w-full cursor-pointer rounded-md border border-transparent px-4 py-2 font-medium text-white shadow-sm",
							"bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
							"disabled:cursor-not-allowed disabled:opacity-50",
						)}
					>
						{signInMutation.isPending
							? "Signing in..."
							: "Log in"}
					</button>
				</div>
			</div>
		</div>
	);
}
