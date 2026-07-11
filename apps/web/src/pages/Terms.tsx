import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="min-h-screen bg-[#050505] text-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-gray-400 hover:text-white mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg mb-8 text-sm">
            <p className="mb-2 font-semibold">Note from the Development Team:</p>
            <p>This product is actively being developed for Enginow. These terms of service are a placeholder and should be replaced with Enginow's official legal documentation before final production release.</p>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-white">1. Agreement to Terms</h2>
          <p className="mb-4">By accessing or using DevCollab (a product by Enginow), you agree to be bound by these Terms of Service.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-white">2. Use License</h2>
          <p className="mb-4">Permission is granted to temporarily use the materials and services on DevCollab's website for personal, non-commercial transitory viewing only.</p>
          
          <p className="mt-12 text-sm text-gray-500">For official inquiries regarding terms, please contact Enginow.</p>
        </div>
      </div>
    </div>
  );
}
