export const MAX_FILE_SIZE = 500 * 1024 * 1024;
const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'];

export function isArchiveFile(file) {
  if (!file?.name) return false;
  const fileName = file.name.toLowerCase();
  return archiveExtensions.some((ext) => fileName.endsWith(ext));
}

export function getFileType(file) {
  if (!file) return null;
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (isVideo) return 'video';
  if (isImage) return 'image';
  if (isArchiveFile(file)) return 'archive';

  return null;
}

export function validateFile(file) {
  if (!file) return null;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Файл слишком большой. Максимальный размер 500MB');
  }

  const fileType = getFileType(file);
  if (!fileType) {
    throw new Error('Пожалуйста, загрузите файл видео, изображения или архива.');
  }

  return fileType;
}
