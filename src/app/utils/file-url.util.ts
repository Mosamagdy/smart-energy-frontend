import { environment } from '../../environments/environment.prod';


export function resolveFileUrl(filePath: string | null | undefined): string {
  if (!filePath) {
    return '';
  }

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  let cleanPath = filePath;

  const uploadsMatch = cleanPath.match(/uploads[/\\].+$/i);
  if (uploadsMatch) {
    cleanPath = uploadsMatch[0];
  }

  cleanPath = cleanPath.replace(/\\/g, '/').replace(/^\/+/, '');

  const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${baseUrl}/${cleanPath}`;
}


export function openFilePreview(filePath: string | null | undefined): boolean {
  const url = resolveFileUrl(filePath);
  if (!url) {
    console.warn('[FilePreview] No file URL available for preview');
    return false;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}