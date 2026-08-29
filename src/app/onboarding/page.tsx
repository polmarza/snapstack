import { SelectionPage } from "@/components/selection/selection-page";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <SelectionPage
      mode="onboarding"
      title="Elige qué enseñar"
      intro="Tus repos públicos de GitHub. Elige los que definen lo que construyes — la curación es la gracia: máximo el límite indicado."
    />
  );
}
