import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load the project's .env placed under src/.env when running from project root.
// Default dotenv.config() loads from process.cwd(), but in some run setups the
// .env is located in `src/.env`. Resolve and load that file explicitly so
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are available when this module
// is imported.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default supabase;