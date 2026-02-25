import './StatCard.css'

function StatCard({ title, value, completed, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
        <span className="stat-icon">
          {Icon && <Icon size={16} strokeWidth={2} />}
        </span>
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-completed">{completed}</div>
      </div>
    </div>
  )
}

export default StatCard
