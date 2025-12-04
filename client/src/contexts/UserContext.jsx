import { createContext } from "react";
import { useRequest } from "../hooks/useRequest";
import useLocalStorage from "../hooks/useLocalStorage";

const UserContext = createContext({
    isAuthenticated: false,
    isAdmin: false,
    user: {
        email: '',
        password: '',
        username: '',
        _createdOn: 0,
        _id: '',
        accessToken: ''
    },
    registerHandler: () => { },
    loginHandler: () => { },
    logoutHandler: () => { },
});

export function UserProvider({ children }) {
    const [user, setUser] = useLocalStorage(null, "auth");
    const { request } = useRequest();

    const registerHandler = async (email, password, name) => {
        const newUser = { email, password, name };

        const result = await request("/users/register", "POST", newUser);

        setUser(result);
        return result;
    };

    const loginHandler = async (email, password) => {
        const result = await request("/users/login", "POST", { email, password });
        setUser(result);
        return result;
    };

    const logoutHandler = async () => {
        if (!user?.accessToken) {
            setUser(null);
            return;
        }

        try {
            await request("/users/logout", "GET", null, {
                "X-Authorization": user.accessToken,
            });
        } catch {
            // Ignore logout errors - token may already be invalid
        }

        setUser(null);
    };

    const userContextValues = {
        user,
        isAuthenticated: !!user?.accessToken,
        isAdmin: user?.isAdmin || (Array.isArray(user?.roles) && user.roles.includes('Admin')),
        registerHandler,
        loginHandler,
        logoutHandler,
    };

    return (
        <UserContext.Provider value={userContextValues}>
            {children}
        </UserContext.Provider>
    );
}

export default UserContext;
