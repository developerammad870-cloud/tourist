// import Link from "next/link";

import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="navbar">

            <ul className="nav-links">
                <h2 className="logo-nav">ℜᗰΔ</h2>

                <Link href="/">Home</Link>

                <Link href="/hotels">Hotels</Link>

                <Link href="/bookings">Bookings</Link>

                <Link href="/login">Login</Link>

                <Link href="/signup">Sign Up</Link>

            </ul>

        </nav>
    );
}