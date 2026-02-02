import './StatCard.css'

function StatCard({ title, value, completed, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <h3>{title}</h3>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-completed">{completed}</div>
    </div>
  )
}

export default StatCard
