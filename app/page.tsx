import type { Metadata } from "next";
import { WitnessPatchLab } from "./components/witnesspatch-lab";

export const metadata: Metadata = {
  title: "Replayable safety tests for healthcare agents",
  description:
    "Turn one synthetic healthcare-agent failure into a red Node test, then check a human-gated repair against locked rules.",
};

export default function Home() {
  return <WitnessPatchLab />;
}
