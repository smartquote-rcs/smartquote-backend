import { Prompt } from '../models/Prompt';
declare class PromptsService {
    create(promptData: Omit<Prompt, 'id'>): Promise<Prompt>;
    getAll(): Promise<Prompt[]>;
    getById(id: number): Promise<Prompt | null>;
    update(id: number, promptData: Partial<Prompt>): Promise<Prompt>;
    delete(id: number): Promise<void>;
}
declare const _default: PromptsService;
export default _default;
//# sourceMappingURL=PromptsService.d.ts.map