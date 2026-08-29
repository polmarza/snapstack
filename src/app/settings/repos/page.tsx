import { SelectionPage } from "@/components/selection/selection-page";

export const dynamic = "force-dynamic";

export default function SettingsReposPage() {
  return (
    <SelectionPage
      mode="settings"
      title="Mis repos"
      intro="Añade o quita repos de tu selección. Los que quites desaparecen del feed y de tu perfil."
    />
  );
}
