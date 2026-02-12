import type { WorkspaceMember } from "../../api";

interface WorkspaceListProps {
  workspaces: WorkspaceMember[];
  activeWorkspaceId: number | null;
  onSelect: (workspaceId: number) => void;
}

const WorkspaceList = ({
  workspaces,
  activeWorkspaceId,
  onSelect,
}: WorkspaceListProps) => {
  return (
    <div className="list">
      {workspaces.length === 0 && <p className="muted">No workspaces yet.</p>}
      {workspaces.map((item) => (
        <button
          key={item.id}
          className={
            item.workspace.id === activeWorkspaceId
              ? "list-item active"
              : "list-item"
          }
          onClick={() => onSelect(item.workspace.id)}
        >
          <span>{item.workspace.name}</span>
          <span className="role">{item.role}</span>
        </button>
      ))}
    </div>
  );
};

export default WorkspaceList;
