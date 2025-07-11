import Link from "next/link";

export default function AuthError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-10 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Authentication Error
        </h1>
        <p className="mt-4 text-gray-700">
          Something went wrong during the authentication process.
          <br />
          Please try again.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
} 