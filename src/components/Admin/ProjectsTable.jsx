import './ProjectsTable.css'

function ProjectsTable({ projects }) {
  return (
    <div className="projects-section">
      <div className="section-header">
        <h2>Active Projects</h2>
        <button className="view-all-btn">View All Projects</button>
      </div>
      <table className="projects-table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Hours</th>
            <th>Priority</th>
            <th>Members</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <tr key={index}>
              <td>
                <div className="project-name">
                  <span className="project-logo">{project.logo}</span>
                  <span>{project.name}</span>
                </div>
              </td>
              <td>{project.hours}</td>
              <td>
                <span className={`priority-badge priority-${project.priority.toLowerCase()}`}>
                  {project.priority}
                </span>
              </td>
              <td>
                <div className="members">
                  <div className="member-avatars">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="member-avatar">{i + 1}</div>
                    ))}
                  </div>
                  <span className="member-count">+{project.members}</span>
                </div>
              </td>
              <td>
                <div className="progress-container">
                  <span className="progress-text">{project.progress}%</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProjectsTable
