import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { resendAdapter } from "@payloadcms/email-resend";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Customers } from "./collections/Customers";
import { Media } from "./collections/Media";
import { Services } from "./collections/Services";
import { Products } from "./collections/Products";
import { News } from "./collections/News";
import { Team } from "./collections/Team";
import { Clients } from "./collections/Clients";
import { Stats } from "./collections/Stats";
import { Leads } from "./collections/Leads";
import { Orders } from "./collections/Orders";
import { CustomerNotes } from "./collections/CustomerNotes";
import { Company } from "./globals/Company";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      views: {
        crmList: {
          Component: "/components/admin/CrmListView#CrmListView",
          path: "/crm",
          exact: true,
        },
        crmDetail: {
          Component: "/components/admin/CrmDetailView#CrmDetailView",
          path: "/crm/:id",
          exact: true,
        },
        dashboard: {
          Component: "/components/admin/DashboardView#DashboardView",
          path: "/dashboard",
          exact: true,
        },
      },
      beforeNavLinks: ["/components/admin/CrmNav#CrmNav", "/components/admin/DashboardNav#DashboardNav"],
    },
  },
  collections: [Users, Customers, Media, Services, Products, News, Team, Clients, Stats, Leads, Orders, CustomerNotes],
  globals: [Company],
  editor: lexicalEditor(),
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || "",
    defaultFromAddress: process.env.LEAD_NOTIFY_FROM || "noreply@novatech.demo",
    defaultFromName: "NovaTech Solutions",
  }),
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
