import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Services } from "./collections/Services";
import { Products } from "./collections/Products";
import { News } from "./collections/News";
import { Team } from "./collections/Team";
import { Clients } from "./collections/Clients";
import { Stats } from "./collections/Stats";
import { Leads } from "./collections/Leads";
import { Orders } from "./collections/Orders";
import { Company } from "./globals/Company";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, Media, Services, Products, News, Team, Clients, Stats, Leads, Orders],
  globals: [Company],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
});
