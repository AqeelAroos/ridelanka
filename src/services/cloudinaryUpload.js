export async function uploadImage(file, folder = 'ridelanka') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.secure_url;
}

export async function uploadMultipleImages(files, folder = 'ridelanka') {
  const uploads = Array.from(files).map((file) => uploadImage(file, folder));
  return Promise.all(uploads);
}
