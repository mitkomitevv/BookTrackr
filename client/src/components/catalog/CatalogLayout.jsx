import { Outlet } from 'react-router';

export default function CatalogLayout() {
    return (
        <div className="flex-1">
            <Outlet />
        </div>
    );
}
