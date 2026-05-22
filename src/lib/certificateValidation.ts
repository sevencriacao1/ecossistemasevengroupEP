export function createCertificateValidationCode(userName: string, courseName: string, completedAt: string | null) {
  const source = `${userName}-${courseName}-${completedAt ?? ''}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return `ARQO-${Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 8)}`;
}
