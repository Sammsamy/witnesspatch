import type { Metadata } from "next";
import { WitnessPatchLab } from "./components/witnesspatch-lab";

export const metadata: Metadata = {
  title: "Turn late AI agent actions into tests",
  description:
    "Compare recorded agent runs under the same deadline rules, then turn an exact missed action into a Node test developers can keep in CI.",
};

export default function Home() {
  return <WitnessPatchLab />;
}
