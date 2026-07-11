import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="min-h-screen bg-[#050505] text-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-gray-400 hover:text-white mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg mb-8 text-sm">
            <p className="mb-2 font-semibold">Note from the Development Team:</p>
            <p>This product is actively being developed for Enginow. This privacy policy is a placeholder and should be replaced with Enginow's official legal documentation before final production release.</p>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-white">1. Introduction</h2>
          <p className="mb-4">Welcome to DevCollab, a product by Enginow. We respect your privacy and are committed to protecting your personal data.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-white">2. Data We Collect</h2>
          <p className="mb-4">We collect information that you provide directly to us when you register for an account, create projects, or communicate with us.</p>
          
          <p className="mt-12 text-sm text-gray-500">For official privacy inquiries, please contact Enginow.</p>
        </div>
      </div>
    </div>
  );
}
