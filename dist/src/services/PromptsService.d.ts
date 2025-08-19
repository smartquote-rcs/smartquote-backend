interface PromptInsert {
    texto_original: string;
    dados_extraidos: any;
    origem: any;
    status?: 'recebido' | 'pendente' | 'analizado' | 'enviado';
}
declare class PromptsService {
    create(prompt: PromptInsert): Promise<number | null>;
}
declare const _default: PromptsService;
export default _default;
//# sourceMappingURL=PromptsService.d.ts.map