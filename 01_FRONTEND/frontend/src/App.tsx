import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import SiteLayout from "@/components/site/SiteLayout";
import Home from "@/pages/Home";
import Tariff from "@/pages/Tariff";
import Services from "@/pages/Services";
import Contact from "@/pages/Contact";
import Book from "@/pages/Book";
import Routes_ from "@/pages/Routes";
import RoutePage from "@/pages/RoutePage";
import ReviewPage from "@/pages/Review";
import Admin from "@/pages/Admin";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tariff" element={<Tariff />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/book" element={<Book />} />
          <Route path="/routes" element={<Routes_ />} />
          <Route path="/routes/:slug" element={<RoutePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="*" element={<Home />} />
        </Route>
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Toaster offset="140px" />
    </>
  );
}
