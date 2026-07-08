import { getClients } from "@/lib/data";

export default async function Clients() {
  const clients = await getClients();

  return (
    <section className="clients-section" id="clients-root">
      <div className="container">
        <h2
          className="section-title text-center reveal"
          style={{ fontSize: "clamp(2rem, 4vw, 2.5rem)", marginBottom: "2rem" }}
        >
          Được tin tưởng bởi các đối tác hàng đầu
        </h2>
        <div className="clients-grid">
          {clients.map((client, index) => (
            <img
              key={client.id}
              src={client.logo}
              alt={client.name}
              className={`client-logo reveal delay-${(index + 1) * 100}`}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
