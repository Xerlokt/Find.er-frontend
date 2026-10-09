// Job card component — used in the swipe stack
const { useState, useEffect, useRef } = React;
const Icons = window.JoberaIcons;

// User's own skills — used to mark matching chips as green
const USER_SKILLS = ['figma', 'design system', 'user research', 'prototipagem', 'design tokens', 'webflow', 'motion', 'after effects', 'pesquisa'];
const userHasSkill = (s) => {
  const x = s.toLowerCase();
  return USER_SKILLS.some(u => x.includes(u) || u.includes(x));
};

function JobCard({ job, drag, isDragging, exiting, isTop, depth = 0 }) {
  // Visual treatment for cards behind the top one
  const baseScale = 1 - depth * 0.04;
  const baseY = depth * 10;

  // Compute transform from drag (top card only)
  let transform = `translate(0px, ${baseY}px) scale(${baseScale})`;
  let transition = 'transform 0.35s cubic-bezier(0.2,0.9,0.25,1.1)';
  let likeOpacity = 0;
  let nopeOpacity = 0;

  if (isTop) {
    if (exiting === 'right') {
      transform = `translate(600px, ${drag.y - 60}px) rotate(${24}deg)`;
      transition = 'transform 0.4s cubic-bezier(0.5,0,0.75,0)';
    } else if (exiting === 'left') {
      transform = `translate(-600px, ${drag.y - 60}px) rotate(${-24}deg)`;
      transition = 'transform 0.4s cubic-bezier(0.5,0,0.75,0)';
    } else if (isDragging) {
      transform = `translate(${drag.x}px, ${drag.y * 0.4}px) rotate(${drag.x * 0.05}deg)`;
      transition = 'none';
      likeOpacity = Math.min(1, Math.max(0, drag.x / 100));
      nopeOpacity = Math.min(1, Math.max(0, -drag.x / 100));
    }
  }

  return (
    <div
      className="job-card"
      style={{
        position: 'absolute',
        inset: 0,
        transform,
        transition,
        zIndex: 10 - depth,
        pointerEvents: isTop ? 'auto' : 'none',
        willChange: 'transform',
      }}
    >
      <div className="card-inner">
        {/* PHOTO TOP HALF */}
        <div
          className="card-photo"
          style={{ background: job.photoBg }}
        >
          {/* Photo placeholder label (mono) */}
          <div className="photo-meta">
            <span style={{ opacity: 0.85 }}>// {job.photoLabel}</span>
          </div>

          {/* Time pill */}
          <div className="card-time">
            <Icons.Clock size={11} stroke="rgba(255,255,255,0.95)" sw={2.4}/>
            <span>{job.posted}</span>
          </div>

          {/* Match score sticker */}
          <div className="match-sticker">
            <div className="match-num">{job.match}</div>
            <div className="match-label">
              <Icons.Sparkle size={9} fill="#0E0913"/>
              <span>match</span>
            </div>
          </div>

          {/* Company logo + name (over photo bottom) */}
          <div className="card-company">
            <div className="logo-circle" style={{ background: job.brandColor }}>
              {job.initial}
            </div>
            <span className="company-name">{job.company}</span>
          </div>

          {/* Drag overlays */}
          <div className="overlay overlay-like" style={{ opacity: likeOpacity }}>
            <span>ROLA</span>
          </div>
          <div className="overlay overlay-nope" style={{ opacity: nopeOpacity }}>
            <span>PASSA</span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="card-body">
          <h2 className="card-title">{job.title}</h2>

          <div className="chip-row">
            <span className="chip chip-salary">
              <Icons.Money size={13} stroke="#0E0913" sw={2.2}/>
              {job.salary}
            </span>
            <span className="chip chip-loc">
              <Icons.Pin size={13} stroke="rgba(14,9,19,0.65)" sw={2}/>
              {job.location}
            </span>
            <span className="chip chip-remote">
              <Icons.Wifi size={13} stroke="rgba(14,9,19,0.65)" sw={2}/>
              {job.remote}
            </span>
          </div>

          <div className="skills-row">
            {job.skills.map(s => {
              const has = userHasSkill(s);
              return (
                <span key={s} className={`skill-chip ${has ? 'skill-chip-have' : ''}`}>
                  {has && <span className="skill-check">✓</span>}
                  {s}
                </span>
              );
            })}
          </div>

          <p className="card-desc">{job.description}</p>

          <div className="benefits-row">
            {job.benefits.slice(0, 4).map((b, i) => (
              <span key={i} className="benefit-pill">{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.JobCard = JobCard;
