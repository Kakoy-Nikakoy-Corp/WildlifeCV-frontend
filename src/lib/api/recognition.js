const API_BASE_URL = 'https://api.irbis.wild1.net';

export async function recognizeFile(fileType, selectedFile) {
  let endpoint = '';

  if (fileType === 'video') endpoint = '/recognise/video/';
  else if (fileType === 'image') endpoint = '/recognise/image/';
  else endpoint = '/recognise/multi-image/';

  const formData = new FormData();
  formData.append('video', selectedFile);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { accept: 'application/json' },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
