import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

// Create router with future flags enabled
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </>
  )
);

const App = () => (
  <ThemeProvider defaultTheme="system">
    <Toaster />
    <Sonner />
    <RouterProvider router={router} />
  </ThemeProvider>
);

export default App;
