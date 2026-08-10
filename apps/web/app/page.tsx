import { api } from "~/trpc/server";

export default async function Home() {
  const { status } = await api.health.getHealth.query();
  
 
  return (
    <main className="min-h-screen min-w-screen flex justify-center items-center">
      <div>
        <h1 className="text-3xl">Fillform </h1>
        <p> -- A Form Builder SAAS Platform -- </p>
        <h2>Health Status : {status}</h2>
        
      </div>
    </main>
  );
}
