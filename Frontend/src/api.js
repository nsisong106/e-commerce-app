const API_URL = import.meta.env.VITE_API_URL;

export async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export async function uploadImage(file, token) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data.url;
}