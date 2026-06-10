import { getClients } from '../services/api.js';
export default async function Clients() {
  const clients = await getClients();
  
  const clientsHtml = clients.map((client, index) => {
    return `
      <img src="${client.logo}" alt="${client.name}" class="client-logo reveal delay-${(index + 1) * 100}" loading="lazy"/>
    `;
  }).join('');

  return `
    <section class="clients-section">
      <div class="container">
        <h2 class="section-title text-center reveal" style="font-size: clamp(2rem, 4vw, 2.5rem); margin-bottom: 2rem;">Được tin tưởng bởi các đối tác hàng đầu</h2>
        <div class="clients-grid">
          ${clientsHtml}
        </div>
      </div>
    </section>
  `;
}
