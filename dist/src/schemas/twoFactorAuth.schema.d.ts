import { z } from 'zod';
export declare const initiateTwoFactorSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const verifyTwoFactorSchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodString;
}, z.core.$strip>;
export declare const completeTwoFactorSchema: z.ZodObject<{
    temporaryToken: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=twoFactorAuth.schema.d.ts.map