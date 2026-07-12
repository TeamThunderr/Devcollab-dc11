import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { RBACProvider } from "./context/RBACContext";
import { AuthProvider } from "./context/AuthContext";
import { AppRoutes } from "./routes/AppRoutes";

import { ProjectTransitionModal } from "./components/common/ProjectTransitionModal";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/Tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <RBACProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ProjectTransitionModal />
                <AppRoutes />

              </BrowserRouter>
            </RBACProvider>
          </AuthProvider>
          <Toaster
            theme="system"
            className="dark:bg-[#191919] dark:border-white/10 dark:text-white bg-white border-black/10 text-black"
            toastOptions={{
              style: {
                background: 'var(--bg)',
                color: 'var(--text)',
                borderColor: 'var(--border)'
              },
              className: 'dark:[--bg:black] dark:[--text:white] dark:[--border:rgba(255,255,255,0.1)] [--bg:white] [--text:black] [--border:rgba(0,0,0,0.1)]'
            }}
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
