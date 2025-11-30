import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./components/home/Home";
import { Route, Routes } from "react-router"
import MyLibrary from "./components/my-library/MyLibrary";
import BookDetails from "./components/details/BookDetails";
import CatalogLayout from "./components/catalog/CatalogLayout";
import Catalog from "./components/catalog/Catalog";
import BookCreateForm from "./components/books/BookCreateForm";
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import { useContext } from "react";
import UserContext from "./contexts/UserContext";

export default function App() {
    const { user } = useContext(UserContext)

    return (
        <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
            <Header />

            <Routes>
                <Route path='/' element={<Home />} />

                <Route path="/catalog" element={<CatalogLayout />}>
                    <Route index element={<Catalog />} />
                    <Route path=":bookId/details" element={<BookDetails />} />
                    <Route path="add-book" element={<BookCreateForm />} />
                </Route>
                
                <Route path='/library' element={<MyLibrary />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />

            </Routes>

            <Footer />
        </div>
    );
}
