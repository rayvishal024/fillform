import { sessionService } from "./services/index";

export type RequestLike = {
	headers: {
		cookie?: string;
	};
};

export type ResponseLike = {
	setHeader(name: string, value: string | string[]): void;
};

export type AuthContext = {
	req: RequestLike;
	res: ResponseLike;
	userId: string | null;
	sessionToken: string | undefined;
};

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const isProduction = String(process.env.NODE_ENV) === "prod";

function cookieName() {
	return isProduction ? "__Secure-session" : "session";
}

function getCookie(cookieHeader: string | undefined, name: string) {
	return cookieHeader
		?.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${name}=`))
		?.slice(name.length + 1);
}

export function setSessionCookie(response: ResponseLike, token: string) {
	const secure = isProduction ? "; Secure" : "";
	response.setHeader(
		"Set-Cookie",
		`${cookieName()}=${token}; Max-Age=${SESSION_MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`,
	);
}

export function clearSessionCookie(response: ResponseLike) {
	const secure = isProduction ? "; Secure" : "";
	response.setHeader(
		"Set-Cookie",
		`${cookieName()}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`,
	);
}

export async function createContext({ req, res }: { req: RequestLike; res: ResponseLike }): Promise<AuthContext> {
	const sessionToken = getCookie(req.headers.cookie, cookieName());
	const userId = await sessionService.getUserId(sessionToken);

	return { req, res, userId, sessionToken };
}
