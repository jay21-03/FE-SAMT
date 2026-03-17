import { Navigate } from "react-router-dom"
import { useProfile } from "../hooks/useAuth"

export default function ProtectedRoute({ children, allowedRoles }) {
  const { data: profile, isLoading } = useProfile()
  const role = profile?.role || profile?.roles?.[0]

  if (isLoading) {
    return null
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />
  }

  return children
}