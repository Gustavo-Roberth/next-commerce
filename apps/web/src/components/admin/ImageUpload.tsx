'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api/client';
import { AlertCircle, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface ImageUploadProps {
  value?: string[];
  onChange?: (images: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  productId?: string;
  label?: string;
  required?: boolean;
}

interface UploadedImage {
  url: string;
  path: string;
  fullPath: string;
  filename: string;
  mimetype: string;
  size: number;
  isMain?: boolean;
}

export function ImageUpload({
  value = [],
  onChange,
  multiple = true,
  maxFiles = 10,
  productId,
  label = 'Imagens do Produto',
  required = false,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(
    value.map((url, index) => ({
      url,
      path: '',
      fullPath: '',
      filename: '',
      mimetype: '',
      size: 0,
      isMain: index === 0,
    }))
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!files || files.length === 0) return;

      const newFiles = Array.from(files);
      if (!multiple && newFiles.length > 1) {
        newFiles.splice(1);
      }

      if (images.length + newFiles.length > maxFiles) {
        setError(`Máximo de ${maxFiles} imagens permitidas`);
        return;
      }

      setError('');
      setUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        for (const file of newFiles) formData.append('files', file);

        const queryParams = new URLSearchParams();
        if (productId) queryParams.set('produto_id', productId);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        const response = await fetch(
          `/api/admin/upload/multiple-product-images${queryParams.toString() ? `?${queryParams}` : ''}`,
          {
            method: 'POST',
            body: formData,
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        const data = (await response.json()) as { images: UploadedImage[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error || 'Erro no upload');
        }

        const newImages: UploadedImage[] = data.images.map((img, index: number) => ({
          url: img.url,
          path: img.path,
          fullPath: img.fullPath,
          filename: img.filename,
          mimetype: img.mimetype,
          size: img.size,
          isMain: !multiple && index === 0,
        }));

        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onChange?.(updatedImages.map((img) => img.url));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
      } finally {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [images, multiple, maxFiles, productId, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    if (image?.path) {
      try {
        await api.delete(`/admin/upload/product-image?path=${encodeURIComponent(image.path)}`);
      } catch (error) {
        console.error('Erro ao remover imagem:', error);
      }
    }
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onChange?.(updatedImages.map((img) => img.url));
  };

  const setMainImage = (index: number) => {
    if (!multiple) return;
    const updatedImages = images.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
    setImages(updatedImages);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={uploading || images.length >= maxFiles}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Adicionar {multiple ? 'Imagens' : 'Imagem'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
        />
        <Label htmlFor="image-upload" className="cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple={multiple}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {images.length === 0 && (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-12 w-12 text-gray-400" />
                <p className="text-gray-600">
                  {multiple
                    ? `Arraste até ${maxFiles} imagens ou clique para selecionar`
                    : 'Clique ou arraste uma imagem'}
                </p>
                <p className="text-sm text-gray-500">
                  Formatos: JPEG, PNG, WebP, AVIF | Máx. 5MB por arquivo
                </p>
              </div>
            )}
          </div>
        </Label>

        {images.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                {images.length}/{maxFiles} imagens
              </p>
              {uploading && (
                <div className="w-32">
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((image, index) => (
                <div
                  key={image.path}
                  className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-50"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    {image.isMain && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          Principal
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    {multiple && !image.isMain && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMainImage(index);
                        }}
                      >
                        Definir principal
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                    {image.filename}
                  </div>
                </div>
              ))}
            </div>

            {uploading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando imagens... {uploadProgress}%</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setError('')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <input
          type="hidden"
          name="product_images"
          value={JSON.stringify(images.map((img) => img.url))}
        />
      </CardContent>
    </Card>
  );
}
