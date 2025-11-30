import { createContext, useState } from "react";
import { useRequest } from "../hooks/useRequest";

const UserContext = createContext({
    isAuthenticated: false,
    user: null,
    registerHandler: () => {},
    loginHandler: () => {},
    logoutHandler: () => {},
});

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const { request } = useRequest();

    const registerHandler = async (email, password) => {
        const newUser = { email, password };

        const result = await request("/users/register", "POST", newUser);

        // auto-login after register (if your API returns token)
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

        await request("/users/logout", "GET", null, {
            "X-Authorization": user.accessToken,
        });

        setUser(null);
    };

    const userContextValues = {
        user,
        isAuthenticated: !!user?.accessToken,
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
