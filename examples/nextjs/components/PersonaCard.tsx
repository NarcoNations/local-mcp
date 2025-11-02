export interface PersonaCardProps {
  name: string;
  role: string;
  focus: string;
  bullets: string[];
}

export function PersonaCard({ name, role, focus, bullets }: PersonaCardProps) {
  return (
    <article className="persona-card">
      <span className="persona-role">{role}</span>
      <h3 className="persona-name">{name}</h3>
      <p className="persona-focus">{focus}</p>
      <ul className="persona-points">
        {bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
