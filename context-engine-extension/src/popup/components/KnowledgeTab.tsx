import React, { useState, useEffect, useRef } from 'react';
import { getDocuments, saveDocument, deleteDocument, type Document } from '../../utils/storage';
import { chunkText } from '../../utils/chunking';
import { batchGenerateEmbeddings } from '../../services/gemini';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const KnowledgeTab: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        const docs = await getDocuments();
        setDocuments(docs);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            setStatusMessage('Only .txt and .md files are supported for now.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setStatusMessage('Reading file...');

        try {
            const text = await file.text();

            setStatusMessage('Chunking text...');
            const chunks = chunkText(text, 1000, 200);

            setStatusMessage(`Generating embeddings for ${chunks.length} chunks...`);

            // Process in batches of 20 to avoid hitting API limits too hard
            const BATCH_SIZE = 20;
            const chunkObjects: { content: string; embedding: number[] }[] = [];

            for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                const batch = chunks.slice(i, i + BATCH_SIZE);
                const embeddings = await batchGenerateEmbeddings(batch);

                batch.forEach((content, index) => {
                    if (embeddings[index]) {
                        chunkObjects.push({
                            content,
                            embedding: embeddings[index]!
                        });
                    }
                });

                setUploadProgress(Math.round(((i + BATCH_SIZE) / chunks.length) * 100));
            }

            setStatusMessage('Saving to database...');
            await saveDocument(file.name, file.name, text, chunkObjects);

            setStatusMessage('Done!');
            setUploadProgress(100);
            loadDocuments();

            // Reset after a delay
            setTimeout(() => {
                setIsUploading(false);
                setStatusMessage('');
                setUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }, 2000);

        } catch (error) {
            console.error('Upload failed:', error);
            setStatusMessage('Upload failed. Check console.');
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this document?')) {
            await deleteDocument(id);
            loadDocuments();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Upload Area */}
            <div
                className="border-2 border-dashed border-border-muted rounded-xl p-8 text-center hover:border-accent-primary/50 hover:bg-surface-2 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".txt,.md"
                    onChange={handleFileSelect}
                />

                {isUploading ? (
                    <div className="space-y-3">
                        <div className="w-12 h-12 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm font-medium text-text-primary">{statusMessage}</p>
                        <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-accent-primary h-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-surface-3 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-text-secondary group-hover:text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        </div>
                        <p className="text-sm font-medium text-text-primary">Click to upload Knowledge</p>
                        <p className="text-xs text-text-secondary">Supports .txt and .md files</p>
                    </div>
                )}
            </div>

            {/* Document List */}
            <div className="space-y-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">Your Knowledge Base</h3>

                {documents.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary text-sm">
                        No documents uploaded yet.
                    </div>
                ) : (
                    documents.map(doc => (
                        <Card key={doc.id} className="p-4 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-text-primary line-clamp-1">{doc.title}</h4>
                                    <p className="text-[10px] text-text-secondary">
                                        {doc.chunkCount} chunks • {new Date(doc.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => doc.id && handleDelete(doc.id)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </Button>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
