import type { Metadata } from "next";
import { WitnessPatchLab } from "./components/witnesspatch-lab";

export const metadata: Metadata = {
  title: "Time-fenced contracts for healthcare agents",
  description:
    "Compile one synthetic contract failure into a red Node test bundle, then separately verify the retained patch and exact-fact control.",
};

export default function Home() {
  return <WitnessPatchLab />;
}
