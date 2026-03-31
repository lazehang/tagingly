import { auth } from "@/lib/auth";
import { publicApiBase } from "./api";

export async function serverApiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const session = await auth();
  const token = session?.accessToken;
  return fetch(`${publicApiBase()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
