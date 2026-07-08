import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../payload.config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getErrorMessage } from "@/lib/errors";

const srcDataDir = path.resolve(process.cwd(), "src/data");

function loadJson(filename: string) {
  const filePath = path.join(srcDataDir, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

export async function GET() {
  try {
    console.log("🌱 Starting seed...");
    const payload = await getPayload({ config });

    const results: string[] = [];

    // 1. Create admin user
    const existingAdmin = await payload.find({
      collection: "users",
      where: { email: { equals: "admin@novatech.demo" } },
      limit: 1,
    });

    if (existingAdmin.docs.length === 0) {
      await payload.create({
        collection: "users",
        data: {
          email: "admin@novatech.demo",
          name: "Admin NovaTech",
          password: "admin123456",
          roles: ["admin"],
        },
      });
      results.push("✅ Created admin user");
    } else {
      results.push("⏭️  Admin user already exists");
    }

    // 2. Seed Company global
    const companyData = loadJson("company.json");
    // findGlobal luôn trả về object (kể cả khi chưa set) → kiểm tra theo field `name`.
    const existingCompany = await payload.findGlobal({ slug: "company" }).catch(() => null);
    if (!existingCompany?.name) {
      await payload.updateGlobal({
        slug: "company",
        data: {
          name: companyData.name,
          tagline: companyData.tagline,
          description: companyData.description,
          technologies: companyData.technologies?.map(
            (t: { id: string; name: string; description: string; icon: string }) => ({
              techId: t.id,
              name: t.name,
              description: t.description,
              icon: t.icon,
            })
          ),
          contact: companyData.contact,
          socials: companyData.socials,
        },
      });
      results.push("✅ Seeded company global");
    } else {
      results.push("⏭️  Company global already exists");
    }

    // 3. Seed Services
    const servicesData = loadJson("services.json");
    for (const svc of servicesData) {
      const existing = await payload.find({
        collection: "services",
        where: { slug: { equals: svc.id } },
        limit: 1,
      });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "services",
          data: {
            slug: svc.id,
            title: svc.title,
            description: svc.description,
            icon: svc.icon,
            details: svc.details,
            features: svc.features?.map((f: string) => ({ feature: f })),
          },
        });
        results.push(`✅ Service: ${svc.title}`);
      } else {
        results.push(`⏭️  Service "${svc.title}" exists`);
      }
    }

    // 4. Seed Products
    const productsData = loadJson("products.json");
    for (const prod of productsData) {
      const existing = await payload.find({
        collection: "products",
        where: { slug: { equals: prod.id } },
        limit: 1,
      });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "products",
          data: {
            slug: prod.id,
            name: prod.name,
            tagline: prod.tagline,
            image: prod.image,
            details: prod.details,
            features: prod.features?.map((f: string) => ({ feature: f })),
          },
        });
        results.push(`✅ Product: ${prod.name}`);
      } else {
        results.push(`⏭️  Product "${prod.name}" exists`);
      }
    }

    // 5. Seed News
    const newsData = loadJson("news.json");
    for (const item of newsData) {
      const existing = await payload.find({
        collection: "news",
        where: { slug: { equals: item.id } },
        limit: 1,
      });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "news",
          data: {
            slug: item.id,
            title: item.title,
            excerpt: item.excerpt,
            date: item.date,
            thumbnail: item.thumbnail,
            content: item.content,
          },
        });
        results.push(`✅ News: ${item.title}`);
      } else {
        results.push(`⏭️  News "${item.title}" exists`);
      }
    }

    // 6. Seed Team
    const teamData = loadJson("team.json");
    for (const member of teamData) {
      const existing = await payload.find({
        collection: "team",
        where: { slug: { equals: member.id } },
        limit: 1,
      });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "team",
          data: {
            slug: member.id,
            name: member.name,
            role: member.role,
            bio: member.bio,
            avatar: member.avatar,
          },
        });
        results.push(`✅ Team: ${member.name}`);
      } else {
        results.push(`⏭️  Team "${member.name}" exists`);
      }
    }

    // 7. Seed Clients
    const clientsData = loadJson("clients.json");
    for (const client of clientsData) {
      const existing = await payload.find({
        collection: "clients",
        where: { slug: { equals: client.id } },
        limit: 1,
      });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "clients",
          data: {
            slug: client.id,
            name: client.name,
            logo: client.logo,
          },
        });
        results.push(`✅ Client: ${client.name}`);
      } else {
        results.push(`⏭️  Client "${client.name}" exists`);
      }
    }

    // 8. Seed Stats
    const statsData = loadJson("stats.json");
    for (let i = 0; i < statsData.length; i++) {
      const stat = statsData[i];
      const existing = await payload.find({
        collection: "stats",
        where: { slug: { equals: stat.id } },
        limit: 1,
      });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "stats",
          data: {
            slug: stat.id,
            value: stat.value,
            label: stat.label,
            suffix: stat.suffix || "",
            order: i,
          },
        });
        results.push(`✅ Stat: ${stat.label}`);
      } else {
        results.push(`⏭️  Stat "${stat.label}" exists`);
      }
    }

    console.log("🎉 Seed completed!");
    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    console.error("❌ Seed failed:", error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
