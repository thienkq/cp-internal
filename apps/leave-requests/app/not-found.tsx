import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-6xl font-extrabold tracking-tight text-heading-foreground md:text-8xl">
        404
      </h1>
      <h2 className="mt-4 text-2xl font-bold text-foreground">
        Page Not Found
      </h2>
      <p className="mt-2 text-lg text-muted-foreground max-w-md">
        Sorry, we couldn't find the page you were looking for. It might have
        been moved or deleted.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block px-8 py-3 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Go back home
      </Link>
    </div>
  );
} 