import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, FileUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';
import { useFirmware } from '../contexts/FirmwareContext';

export function FirmwareUploadDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [version, setVersion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { uploadFirmware } = useFirmware();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.bin']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !version) return;

    const formData = new FormData();
    formData.append('firmware', file);
    formData.append('version', version);

    try {
      await uploadFirmware(formData);
      setIsOpen(false);
      setVersion('');
      setFile(null);
    } catch (error) {
      // Error handling is done in FirmwareContext
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Firmware
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload New Firmware</DialogTitle>
          <DialogDescription>
            Upload a new firmware version for your AgriNode sensors. Make sure to use semantic versioning (e.g., 1.0.0) and provide a compatible .bin file. Only administrators can upload and manage firmware versions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              placeholder="1.0.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
              pattern="\d+\.\d+\.\d+"
              title="Please use semantic versioning (e.g., 1.0.0)"
            />
          </div>
          <div className="space-y-2">
            <Label>Firmware File</Label>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25",
                "hover:border-primary hover:bg-primary/5"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <FileUp className="h-8 w-8" />
                {file ? (
                  <p className="font-medium text-foreground">{file.name}</p>
                ) : isDragActive ? (
                  <p>Drop the firmware file here</p>
                ) : (
                  <>
                    <p>Drag & drop firmware file here, or click to select</p>
                    <p className="text-xs">Only .bin files are supported</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button type="submit" disabled={!file || !version} className="w-full">
            Upload Firmware
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}