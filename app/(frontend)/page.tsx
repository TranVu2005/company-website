import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Products from "@/components/Products";
import Team from "@/components/Team";
import Stats from "@/components/Stats";
import Clients from "@/components/Clients";
import News from "@/components/News";
import Contact from "@/components/Contact";
import { getStats } from "@/lib/data";

export default async function HomePage() {
  const stats = await getStats();

  return (
    <main id="main-content">
      <Hero />
      <About />
      <Services />
      <Products />
      <Team />
      <Stats stats={stats} />
      <Clients />
      <News />
      <Contact />
    </main>
  );
}
