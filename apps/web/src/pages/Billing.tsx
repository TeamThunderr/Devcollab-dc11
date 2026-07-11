import React from "react";
import { Check, CreditCard, Shield, Zap } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";

export function Billing() {
  const { currentUser: user, login } = useAuth();
  
  const updatePlanMutation = useMutation({
    mutationFn: async (plan: 'FREE' | 'PRO') => {
      const response = await api.patch('/api/users/me', { plan });
      return response.data;
    },
    onSuccess: (updatedUser) => {
      login(updatedUser);
      toast.success(`Plan updated to ${updatedUser.plan}!`);
    },
    onError: () => {
      toast.error("Failed to update plan");
    }
  });
  
  const isUpdating = updatePlanMutation.isPending;
  
  return (
    <DashboardLayout title="Billing">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Billing & Plans
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage your subscription, billing details, and view invoices.
          </p>
        </div>

        {/* Current Plan Alert */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-indigo-900 dark:text-indigo-300 font-medium mb-0.5">Current Plan</p>
              <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wide">
                {(user as any)?.plan || "Free"}
              </h2>
            </div>
          </div>
          {(user as any)?.plan !== "PRO" && (
            <button 
              onClick={() => updatePlanMutation.mutate('PRO')}
              disabled={isUpdating}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isUpdating ? "Upgrading..." : "Upgrade to Pro"}
            </button>
          )}
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* Free Tier */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-8 bg-white dark:bg-[#111111] flex flex-col relative overflow-hidden">
            {(user as any)?.plan === "FREE" && (
              <div className="absolute top-0 inset-x-0 h-1 bg-gray-300 dark:bg-gray-600"></div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Starter</h3>
              <p className="text-sm text-gray-500">Perfect for small teams and individual developers getting started.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
              <span className="text-gray-500 font-medium">/month</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {[
                "1 Workspace & up to 3 Projects",
                "Real-time Task Board & Wiki",
                "Shared Code Editor & Snippets",
                "Basic Role Access",
                "Standard AI Assistant",
                "Real-time Team Chat & Messaging",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => updatePlanMutation.mutate('FREE')}
              disabled={(user as any)?.plan === "FREE" || isUpdating}
              className="w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {(user as any)?.plan === "FREE" ? "Current Plan" : (isUpdating ? "Downgrading..." : "Downgrade to Starter")}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="border border-indigo-200 dark:border-indigo-800 rounded-2xl p-8 bg-white dark:bg-[#111111] flex flex-col relative overflow-hidden shadow-xl shadow-indigo-100/20 dark:shadow-none ring-1 ring-indigo-500/10 scale-100 lg:scale-105 z-10">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                Pro <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 uppercase tracking-wider">Popular</span>
              </h3>
              <p className="text-sm text-gray-500">For scaling teams that need advanced features and unlimited limits.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$12</span>
              <span className="text-gray-500 font-medium">/user/month</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 pb-2 border-b border-gray-100 dark:border-gray-800/50">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">Everything in Starter, plus:</span>
              </li>
              {[
                "Unlimited Workspaces & Projects",
                "Unlimited AI Assistant",
                "Workspace Analytics & Tracking",
                "Client & Viewer Portals",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => updatePlanMutation.mutate('PRO')}
              disabled={(user as any)?.plan === "PRO" || isUpdating}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              {(user as any)?.plan === "PRO" ? "Current Plan" : (isUpdating ? "Upgrading..." : "Upgrade to Pro")}
            </button>
          </div>
        </div>

        {/* Payment Methods Placeholder */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-white dark:bg-[#111111] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Visa ending in 4242</p>
                <p className="text-xs text-gray-500">Expires 12/28</p>
              </div>
            </div>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              Edit
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
