import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./components/home/Home";
import { Route, Routes } from "react-router"
import Catalog from "./components/catalog/catalog";
import MyLibrary from "./components/my-library/MyLibrary";
import BookDetails from "./components/details/BookDetails";
import CatalogLayout from "./components/catalog/CatalogLayout";
import AddBookForm from "./components/books/AddBookForm";

export default function App() {
    return (
        <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
            <Header />

            <Routes>
                <Route path='/' element={<Home />} />
                <Route path="/catalog" element={<CatalogLayout />}>
                    <Route index element={<Catalog />} />
                    <Route path=":bookId/details" element={<BookDetails />} />
                    <Route path="add-book" element={<AddBookForm />} />
                </Route>
                <Route path='/library' element={<MyLibrary />} />

            </Routes>

            <Footer />
        </div>
    );
}
