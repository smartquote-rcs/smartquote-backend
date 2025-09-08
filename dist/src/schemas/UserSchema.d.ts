import { z } from 'zod';
export declare const userSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    contact: z.ZodString;
    password: z.ZodString;
    department: z.ZodString;
    position: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=UserSchema.d.ts.map