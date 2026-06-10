import { getTeam } from '../services/api.js';
export default async function Team() {
  const team = await getTeam();
  
  const teamHtml = team.map((member, index) => {
    return `
      <div class="team-card reveal delay-${(index + 1) * 100}">
        <div class="team-avatar-wrapper">
          <img src="${member.avatar}" alt="${member.name}" class="team-avatar" loading="lazy" />
        </div>
        <div class="team-info">
          <h3 class="team-name">${member.name}</h3>
          <div class="team-role">${member.role}</div>
          <p class="team-bio">${member.bio}</p>
          <div class="team-socials">
            <a href="#" class="social-icon">In</a>
            <a href="#" class="social-icon">Tw</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="team-section">
      <div class="container">
        <div class="reveal">
          <span class="section-subtitle text-center">Đội Ngũ Chuyên Gia</span>
          <h2 class="section-title">Những Người Dẫn Dắt</h2>
        </div>
        
        <div class="grid grid-4">
          ${teamHtml}
        </div>
      </div>
    </section>
  `;
}
