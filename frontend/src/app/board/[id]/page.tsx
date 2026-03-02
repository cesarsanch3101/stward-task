import BoardClient from "./board-page-client";

export async function generateStaticParams() {
  return [{ id: "board" }];
}

export const dynamic = "force-static";

export default function Page() {
  return <BoardClient />;
}
