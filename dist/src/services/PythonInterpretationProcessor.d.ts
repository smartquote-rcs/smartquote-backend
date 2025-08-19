/**
 * Serviço para executar processamento de interpretações em Python
 */
import type { EmailInterpretation } from './GeminiInterpretationService';
interface PythonProcessResult {
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
}
declare class PythonInterpretationProcessor {
    private readonly scriptPath;
    private readonly minPool;
    private readonly maxPool;
    private readonly taskTimeoutMs;
    private readonly idleTtlMs;
    private queue;
    private workers;
    constructor(options?: {
        minPool?: number;
        maxPool?: number;
        taskTimeoutMs?: number;
        idleTtlMs?: number;
    });
    /**
     * Enfileira e dispara se houver worker livre
     */
    processInterpretation(interpretation: EmailInterpretation): Promise<PythonProcessResult>;
    private pump;
    private registerExitHandlers;
    private onWorkerFree;
    /**
     * Verifica se Python está disponível no sistema
     */
    checkPythonAvailability(): Promise<boolean>;
}
export default PythonInterpretationProcessor;
export declare const pythonProcessor: PythonInterpretationProcessor;
export type { PythonProcessResult };
//# sourceMappingURL=PythonInterpretationProcessor.d.ts.map