import { Link } from "react-router-dom";
import { useProfile } from "../hooks/useAuth";
import { useUserGroups } from "../hooks/useUserGroups";
import { isStudentLeader } from "../utils/access";

const TAB_ITEMS = [
  { key: "team-board", label: "Team Board", to: "/app/student/team-board" },
  { key: "my-work", label: "My Work", to: "/app/student/my-work" },
  { key: "project-config", label: "Project Config", to: "/app/student/project-config" },
  { key: "my-stats", label: "My Stats", to: "/app/student/stats" },
];

export default function StudentWorkspaceTabs({ activeTab }) {
  const { data: profile } = useProfile();
  const currentUserId = Number(profile?.id || 0);
  const { data: membershipsData } = useUserGroups(currentUserId);
  const canSeeTeamBoard = isStudentLeader(membershipsData);
  const tabs = canSeeTeamBoard ? TAB_ITEMS : TAB_ITEMS.filter((t) => t.key !== "team-board");

  return (
    <div className="tab-row">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          className={`tab ${activeTab === tab.key ? "tab-active" : ""}`.trim()}
          to={tab.to}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}