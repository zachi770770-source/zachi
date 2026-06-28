import { Suspense } from "react";
import { SituationForm } from "./SituationForm";

export default function SituationPage() {
  return (
    <Suspense fallback={null}>
      <SituationForm />
    </Suspense>
  );
}
