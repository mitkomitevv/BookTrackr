import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./components/home/Home";
import { Route, Routes } from "react-router"
import MyLibrary from "./components/my-library/MyLibrary";
import BookDetails from "./components/details/BookDetails";
import CatalogLayout from "./components/catalog/CatalogLayout";
import Catalog from "./components/catalog/Catalog";
import BookSaveForm from "./components/books/BookSaveForm";
import Login from "./components/login/Login";
import Register from "./components/register/Register";
// import { useContext } from "react";
import UserContext from "./contexts/UserContext";
import Logout from "./components/logout/Logout";
import AdminPanel from "./components/admin-panel/AdminPanel";

export default function App() {
    // const { user } = useContext(UserContext)

    return (
        <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
            <Header />

            {/* TODO: show admin link only for admins */}
            {/* TODO: Route Guards */}
            <Routes>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path='/' element={<Home />} />

                <Route path="/catalog" element={<CatalogLayout />}>
                    <Route index element={<Catalog />} />
                    <Route path=":bookId/details" element={<BookDetails />} />
                    <Route path=":bookId/edit" element={<BookSaveForm />} />
                    <Route path="add-book" element={<BookSaveForm />} />
                </Route>
                
                <Route path='/library' element={<MyLibrary />} />
                <Route path='/register' element={<Register />} />
                <Route path='/login' element={<Login />} />
                <Route path="/logout" element={<Logout />} />
            </Routes>

            <Footer />
        </div>
    );
}
