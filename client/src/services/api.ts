// client/src/services/api.ts
export async function apiRequest(method: string, url: string): Promise<any> {
  const response = await fetch(url, { method });
  return response.json();
}