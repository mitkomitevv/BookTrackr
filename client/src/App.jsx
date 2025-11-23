import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./components/home/Home";
import { Route, Routes } from "react-router"
import Catalog from "./components/catalog/catalog";

export default function App() {
    return (
        <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
            <Header />

            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/catalog' element={<Catalog />} />

            </Routes>

            <Footer />
        </div>
    );
}
