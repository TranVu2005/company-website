import { getTeam } from "@/lib/data";

export default async function Team() {
  const team = await getTeam();

  return (
    <section className="team-section" id="team-root">
      <div className="container">
        <div className="reveal">
          <span className="section-subtitle text-center">Đội Ngũ Chuyên Gia</span>
          <h2 className="section-title">Những Người Dẫn Dắt</h2>
        </div>

        <div className="grid grid-4">
          {team.map((member, index) => (
            <div key={member.id} className={`team-card reveal delay-${(index + 1) * 100}`}>
              <div className="team-avatar-wrapper">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="team-avatar"
                  loading="lazy"
                />
              </div>
              <div className="team-info">
                <h3 className="team-name">{member.name}</h3>
                <div className="team-role">{member.role}</div>
                <p className="team-bio">{member.bio}</p>
                <div className="team-socials">
                  <a href="#" className="social-icon">
                    In
                  </a>
                  <a href="#" className="social-icon">
                    Tw
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
