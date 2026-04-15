import Header from "../components/Header";
import Footer from "../components/Footer";
import ScrollTop from "../components/ScrollToTop";
import Preloader from "../components/Preloader";

export default function MainLayout({ children }) {
  return (
    <div className="index-page">
      <Header />

      <main className="main">{children}</main>

      <Footer />
      <ScrollTop />
  
    </div>
  );
}