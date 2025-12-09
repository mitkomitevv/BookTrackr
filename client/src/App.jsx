import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './components/home/Home';
import { Route, Routes } from 'react-router';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import MyLibrary from './components/my-library/MyLibrary';
import BookDetails from './components/details/BookDetails';
import CatalogLayout from './components/catalog/CatalogLayout';
import Catalog from './components/catalog/Catalog';
import BookSaveForm from './components/books/BookSaveForm';
import AdminPanel from './components/admin-panel/AdminPanel';
import ProtectedRoute from './components/guards/ProtectedRoute';

export default function App() {
    return (
        <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
            <Header />

            <Routes>
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
                <Route path="/" element={<Home />} />

                <Route path="/catalog" element={<CatalogLayout />}>
                    <Route index element={<Catalog />} />
                    <Route path=":bookId/details" element={<BookDetails />} />
                    <Route path=":bookId/edit" element={<ProtectedRoute><BookSaveForm /></ProtectedRoute>} />
                    <Route path="add-book" element={<ProtectedRoute><BookSaveForm /></ProtectedRoute>} />
                </Route>

                <Route path="/library" element={<ProtectedRoute><MyLibrary /></ProtectedRoute>} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<ProtectedRoute><Logout /></ProtectedRoute>} />
            </Routes>

            <Footer />
        </div>
    );
}
