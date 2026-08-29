import { SelectionPage } from "@/components/selection/selection-page";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <SelectionPage
      mode="onboarding"
      title="Pick what to show"
      intro="Your public GitHub repos. Choose the ones that define what you build — curation is the point."
    />
  );
}
