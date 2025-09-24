import { APP_NAME } from "@/lib/constants";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <h1 className="text-xl font-bold">{APP_NAME}</h1>
        </div>
      </div>
    </header>
  );
}
