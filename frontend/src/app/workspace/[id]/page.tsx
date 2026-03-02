import WorkspaceClient from "./WorkspaceClient";

export async function generateStaticParams() {
  return [{ id: "dashboard" }];
}

export const dynamic = "force-static";

export default function Page() {
  return <WorkspaceClient />;
}
