import { z } from 'zod';
export declare const notificationSchema: z.ZodObject<{
    title: z.ZodString;
    subject: z.ZodString;
    type: z.ZodString;
    url_redir: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    is_read: z.ZodOptional<z.ZodBoolean>;
    user_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const notificationUpdateSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    url_redir: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    is_read: z.ZodOptional<z.ZodBoolean>;
    user_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const markMultipleAsReadSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodNumber>;
}, z.core.$strip>;
export declare const estoqueVerificationSchema: z.ZodObject<{
    estoqueMinimo: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
}, z.core.$strip>;
//# sourceMappingURL=NotificationSchema.d.ts.map