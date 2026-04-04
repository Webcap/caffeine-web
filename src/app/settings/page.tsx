import SettingsClient from "@/app/settings/SettingsClient";

export const metadata = {
  title: "Settings | Caffeine",
  description: "Manage your Caffeine account, profile, and appearance.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
