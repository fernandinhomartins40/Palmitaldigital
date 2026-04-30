import { useState } from 'react';
import { api } from '../services/api';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File): Promise<{ id: string; url: string }> {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (error: any) {
      if (error.response?.status === 413) {
        throw new Error('Arquivo muito grande. O limite atual de upload e 25 MB por arquivo.');
      }
      throw error;
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading };
}
