import { SelectionPage } from "@/components/selection/selection-page";

export const dynamic = "force-dynamic";

export default function SettingsReposPage() {
  return (
    <SelectionPage
      mode="settings"
      title="My repos"
      intro="Add or remove repos from your selection. Removed repos disappear from the feed and your profile."
    />
  );
}
