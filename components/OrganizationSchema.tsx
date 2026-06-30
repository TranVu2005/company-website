import { getCompanyInfo } from "@/lib/data";
import { SITE_URL, SITE_NAME } from "@/lib/site";

/**
 * JSON-LD schema.org Organization (mục 8 — SEO kỹ thuật).
 * Giúp Google hiển thị thông tin doanh nghiệp phong phú hơn.
 */
export default async function OrganizationSchema() {
  const company = await getCompanyInfo();

  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: company.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.contact.address,
      addressCountry: "VN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: company.contact.phone,
      email: company.contact.email,
      contactType: "customer service",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
