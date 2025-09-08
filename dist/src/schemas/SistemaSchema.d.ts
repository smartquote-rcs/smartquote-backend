import { z } from 'zod';
export declare const sistemaSchema: z.ZodObject<{
    nome_empresa: z.ZodString;
    idioma: z.ZodString;
    fuso_horario: z.ZodString;
    moeda: z.ZodString;
    backup: z.ZodString;
    manutencao: z.ZodBoolean;
    tempo_de_sessao: z.ZodNumber;
    politica_senha: z.ZodEnum<{
        forte: "forte";
        medio: "medio";
    }>;
    log_auditoria: z.ZodBoolean;
    ip_permitidos: z.ZodString;
}, z.core.$strip>;
export declare const sistemaUpdateSchema: z.ZodObject<{
    nome_empresa: z.ZodOptional<z.ZodString>;
    idioma: z.ZodOptional<z.ZodString>;
    fuso_horario: z.ZodOptional<z.ZodString>;
    moeda: z.ZodOptional<z.ZodString>;
    backup: z.ZodOptional<z.ZodString>;
    manutencao: z.ZodOptional<z.ZodBoolean>;
    tempo_de_sessao: z.ZodOptional<z.ZodNumber>;
    politica_senha: z.ZodOptional<z.ZodEnum<{
        forte: "forte";
        medio: "medio";
    }>>;
    log_auditoria: z.ZodOptional<z.ZodBoolean>;
    ip_permitidos: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SistemaInput = z.infer<typeof sistemaSchema>;
export type SistemaUpdateInput = z.infer<typeof sistemaUpdateSchema>;
//# sourceMappingURL=SistemaSchema.d.ts.map