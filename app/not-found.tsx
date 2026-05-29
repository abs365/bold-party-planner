import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar lightBg />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">404</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
          <p className="text-gray-500 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary">Go home</Link>
            <Link href="/browse" className="btn-secondary-light">Browse vendors</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
