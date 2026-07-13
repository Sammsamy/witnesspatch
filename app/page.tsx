import type { Metadata } from "next";
import { WitnessPatchLab } from "./components/witnesspatch-lab";

export const metadata: Metadata = {
  title: "Compile healthcare AI failures into tests",
  description:
    "Turn a synthetic healthcare-agent contract failure into a reproducible regression test and software-verified repair.",
};

export default function Home() {
  return <WitnessPatchLab />;
}
