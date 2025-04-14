import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
    return (
        <>
            <Navbar />
            <main className="container mx-auto p-4">
                {/* Your main content will go here */}
                <Outlet />
            </main>
        </>
            
    )
}

export default Layout;