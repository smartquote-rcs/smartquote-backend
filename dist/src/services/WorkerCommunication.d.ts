/**
 * Serviço de comunicação entre worker e processo principal
 * Funciona tanto com IPC quanto com arquivos em produção
 */
interface WorkerMessage {
    type: string;
    payload: {
        action: string;
        timestamp: string;
        data: any;
    };
}
export declare class WorkerCommunication {
    private readonly messageDir;
    private readonly messageFile;
    private isIPCAvailable;
    constructor();
    /**
     * Garante que o diretório de mensagens existe
     */
    private ensureMessageDirectory;
    /**
     * Envia mensagem do worker para o processo principal
     */
    sendMessage(type: string, data: any): void;
    /**
     * Fallback: salva mensagem em arquivo para o processo principal ler
     */
    private fallbackToFile;
    /**
     * Lê mensagens do arquivo (para o processo principal)
     */
    readMessages(): WorkerMessage[];
    /**
     * Verifica se há mensagens pendentes
     */
    hasMessages(): boolean;
}
export default WorkerCommunication;
//# sourceMappingURL=WorkerCommunication.d.ts.map