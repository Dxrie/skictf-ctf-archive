import User from "@/components/User";

export default async function TeamPage(context: {
  params: Promise<{ id: string }>;
}) {
  return <User teamId={(await context.params).id}></User>;
}
