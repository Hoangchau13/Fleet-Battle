import './StatCard.css'

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="stat-card-dashboard">
      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
        <span className="stat-icon-dashboard">
          {Icon && <Icon size={16} strokeWidth={2} />}
        </span>
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
      </div>
    </div>
  )
}

export default StatCard
