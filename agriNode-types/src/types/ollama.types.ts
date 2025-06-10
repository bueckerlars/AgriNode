export interface ModelDetails {
    name: string;
    modelfile?: string;
    parameters?: string;
    quantization?: string;
    size?: number;
    format?: string;
    families?: string[];
    parameter_size?: string;
}

export interface ModelInstallParams {
    name: string;
    modelfile?: string;
    insecure?: boolean;
}

export interface ModelInstallProgress {
    status: string;
    completed?: boolean;
    digest?: string;
    total?: number;
    completed_size?: number;
    progress?: number;
    total_downloaded?: number;
    estimated_total_size?: number;
    file_count?: number;
    current_file?: string;
    file_progress?: Record<string, { total: number, completed: number }>;
}

export interface InstallModelRequest {
    name: string;
    modelfile?: string;
    insecure?: boolean;
} 