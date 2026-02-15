import Image from "next/image";
import LoginButton from "../components/LoginButton";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-8 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Octo Feed
          </h1>

          {/* GitHub Authentication Component */}
          <div className="w-full max-w-md">
            <LoginButton />
          </div>
        </div>
      </main>
    </div>
  );
}
