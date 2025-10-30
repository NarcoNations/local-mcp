import { WorkroomView } from "../../src/components/workroom/WorkroomView";
import { getInitialStickies } from "../../src/data/workroom";

export default async function WorkroomPage() {
  const initialStickies = await getInitialStickies();
  return <WorkroomView initialStickies={initialStickies} />;
}
