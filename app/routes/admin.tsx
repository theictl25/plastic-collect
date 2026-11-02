import { AdminGate } from "../components/auth/AdminGate";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { AppProvider } from "~/context/AppContext";

export default function Admin() {
  return (
    <AdminGate>
      <AppProvider>
        <AdminDashboard />
      </AppProvider>
    </AdminGate>
  );
}
