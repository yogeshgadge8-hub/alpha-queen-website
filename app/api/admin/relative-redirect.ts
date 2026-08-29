export function relativeRedirect(path: string, params?: Record<string, string>) {
  const location = new URL(path, "https://relative.invalid");

  for (const [key, value] of Object.entries(params ?? {})) {
    location.searchParams.set(key, value);
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `${location.pathname}${location.search}${location.hash}`,
    },
  });
}
