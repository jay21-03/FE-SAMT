import { Link, Navigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { useProfile } from "../../hooks/useAuth";
import { useUserGroups } from "../../hooks/useUserGroups";

export default function StudentProjectConfigQuick() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const currentUserId = Number(profile?.id || 0);
  const { data: membershipsData, isLoading: membershipsLoading } = useUserGroups(currentUserId);

  if (profileLoading || membershipsLoading) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <p>Loading project configuration...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const groups = membershipsData?.groups || [];
  const primaryGroup = groups[0] || null;

  if (!primaryGroup?.groupId) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <h2 className="project-config-invalid-title">No Group</h2>
            <p className="project-config-invalid-text">
              You are not assigned to any group yet, so project config is unavailable.
            </p>
            <Link className="primary-button" to="/app/groups">
              Go to My Groups
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <Navigate to={`/app/groups/${primaryGroup.groupId}/config`} replace />;
}
