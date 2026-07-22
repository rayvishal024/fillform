import { api } from "~/trpc/server";

export default async function Home() {
   const { status } = await api.health.getHealth.query();
  const { message } = await api.hello.query({ name: "Vishal" })
  
  const { message: welcomeMessage } = await api.welcome.query();
  
  return (
    <main className="min-h-screen min-w-screen flex justify-center items-center">
      <div>
        <h1 className="text-3xl">Streamyst - Stream in Style</h1>
        <h2>Health Status : {status}</h2>
        <h2>Message : { message }</h2>
        <h2>Welcome Message : { welcomeMessage }</h2>
      </div>
    </main>
  );
}
