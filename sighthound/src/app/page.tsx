import Navbar from "@/components/navBar";
import UploadForm from "@/components/uploadForm";

// src/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-800 overflow-auto scrollbar-hidden">
      {/* Hero Section */}
      <section className="bg-gray-100 py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          AI-Powered Car Insurance Claims
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Upload crash images and incident reports to get damage analysis and payout estimates instantly.
        </p>
        <a href="#upload" className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-blue-700 transition">
          Get Started
        </a>
      </section>

      {/* Upload Section Placeholder */}
      <section id="upload" className="py-16 px-6 max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-semibold mb-4">Upload Your Claim</h2>
        <p className="text-gray-500 mb-8">This is where the upload form will go.</p>
        <div className="border-2 border-dashed border-gray-300 p-10 rounded-xl bg-gray-50 text-gray-400 bg-stone-50">
          <UploadForm/>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">🚗 Damage Detection</h3>
            <p>Custom-trained YOLOv8 model identifies dents, scratches, and cracks in real-time.</p>
          </div>
          <div className="p-6 border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">🔍 Fraud Risk Flagging</h3>
            <p>Heuristics and metadata analysis detect suspicious claims.</p>
          </div>
          <div className="p-6 border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">💵 Instant Payouts</h3>
            <p>Policy-based estimations with tiered coverage: Basic, Standard, Premium.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 px-6 text-center text-sm text-gray-500">
        <p>© 2025 Corgi AI Insurance (Demo)</p>
        <p>Built with Next.js, Tailwind, Supabase, and FastAPI</p>
      </footer>
    </main>
  );
}
