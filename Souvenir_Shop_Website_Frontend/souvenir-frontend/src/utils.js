export function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getRoleFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = parseJwt(token);
  return (
    payload?.role ||
    payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    null
  );
}