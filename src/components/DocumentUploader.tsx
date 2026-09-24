'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, FileCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { detectPageCount } from '@/lib/pdf';
import { DocumentDetails } from '@/types';

interface DocumentUploaderProps {
  document: DocumentDetails | null;
  onDocumentChange: (doc: DocumentDetails | null) => void;
}

export function DocumentUploader({ document, onDocumentChange }: DocumentUploaderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMsg('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedExtensions.includes(ext || '') && !allowedTypes.includes(file.type)) {
      setErrorMsg('Only PDF and JPG/JPEG/PNG files are allowed.');
      return;
    }

    setIsParsing(true);
    try {
      const pageCount = await detectPageCount(file);
      const url = URL.createObjectURL(file);
      onDocumentChange({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        fileUrl: url,
        totalPages: pageCount,
      });
    } catch (err) {
      console.error(err);
      onDocumentChange({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/pdf',
        totalPages: 1,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white border border-blue-100 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-blue-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Upload className="w-5 h-5" />
            </div>
            <span>Step 2 — Upload Document</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 ml-10">
            PDF, JPG & PNG supported • Automatic page count detection
          </p>
        </div>

        {document && (
          <button
            type="button"
            onClick={() => onDocumentChange(null)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold transition self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Change File</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!document ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsHovered(true);
          }}
          onDragLeave={() => setIsHovered(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
            isHovered
              ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
              : 'border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-50/70'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />

          {isParsing ? (
            <div className="flex flex-col items-center py-4">
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-bold text-gray-800">Analyzing Document & Detecting Pages...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-3 text-blue-600 shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-base font-extrabold text-gray-900 mb-1">
                Tap or Drag & Drop Document Here
              </p>
              <p className="text-xs text-gray-500 mb-4">
                or <span className="text-blue-600 underline font-semibold">browse files on your device</span>
              </p>
              <div className="flex items-center gap-2 text-[11px] text-blue-800 bg-blue-100/70 px-3.5 py-1.5 rounded-xl border border-blue-200 font-semibold">
                <span>PDF, JPG, PNG</span>
                <span>•</span>
                <span>Instant Page Counter</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-200">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
                  {document.fileName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{formatBytes(document.fileSize)}</span>
                  <span>•</span>
                  <span className="uppercase text-blue-600 font-mono font-bold">
                    {document.fileType.split('/')[1] || 'PDF'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ready for Print</span>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Pages Detected:</span>
              <span className="text-sm font-extrabold text-blue-700 bg-blue-100 px-3 py-0.5 rounded-lg border border-blue-300">
                {document.totalPages} {document.totalPages === 1 ? 'Page' : 'Pages'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">Manual override:</span>
              <input
                type="number"
                min={1}
                max={999}
                value={document.totalPages}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    onDocumentChange({
                      ...document,
                      totalPages: val,
                    });
                  }
                }}
                className="w-16 bg-white border border-blue-300 text-gray-900 rounded-lg px-2 py-1 text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
