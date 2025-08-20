import { z } from 'zod';
export declare const signUpSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type SignUpDTO = z.infer<typeof signUpSchema>;
//# sourceMappingURL=signUp.schema.d.ts.map