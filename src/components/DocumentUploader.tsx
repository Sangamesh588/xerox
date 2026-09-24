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
    const allowedExtensions = ['pdf', 'jpg', 'jpeg'];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];

    if (!allowedExtensions.includes(ext || '') && !allowedTypes.includes(file.type)) {
      setErrorMsg('Only PDF and JPG/JPEG image files are allowed. Word documents (.doc, .docx) are not supported.');
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-violet-400" />
            <span>2. Upload Document</span>
          </h2>
          <p className="text-xs text-slate-400">PDF and JPG / JPEG Images ONLY (Automatic page count detection)</p>
        </div>

        {document && (
          <button
            onClick={() => onDocumentChange(null)}
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Change Document</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
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
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
            isHovered
              ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg"
            className="hidden"
          />

          {isParsing ? (
            <div className="flex flex-col items-center py-4">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-200">Parsing Document & Calculating Pages...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400 shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-white mb-1">
                Drag & Drop your document here
              </p>
              <p className="text-xs text-slate-400 mb-4">
                or <span className="text-cyan-400 underline font-medium">browse PDF or JPG files</span>
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span>Supports PDF & JPG/JPEG</span>
                <span>•</span>
                <span className="text-cyan-300 font-semibold">Strict File Validation</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                <FileCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base truncate max-w-xs sm:max-w-md">
                  {document.fileName}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>{formatBytes(document.fileSize)}</span>
                  <span>•</span>
                  <span className="uppercase text-cyan-400 font-mono font-semibold">
                    {document.fileType.split('/')[1] || 'PDF'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for Print</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Total File Pages Detected:</span>
              <span className="text-sm font-extrabold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                {document.totalPages} Pages
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Adjust page count:</span>
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
                className="w-16 bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-center font-bold focus:outline-none focus:border-violet-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
