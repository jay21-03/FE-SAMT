export default function RoleGuard({ children, allowedRoles }) {
  const role = localStorage.getItem("role");

  if (!role || (allowedRoles && !allowedRoles.includes(role))) {
    return null;
  }

  return children;
}

