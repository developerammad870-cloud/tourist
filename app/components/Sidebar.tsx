"use client";

import Link from "next/link";
import { useState } from "react";

export default function Sidebar({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(true);

    return (
        <>
            <aside className={open ? "sidebar" : "sidebar sidebar-closed"}>
                <button
                    className="collapse-btn"
                    onClick={() => setOpen(!open)}
                    aria-label="Toggle sidebar"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" />
                        <path d="m12 19-7-7 7-7" />
                    </svg>
                </button>

                {open && (
                    <ul>
                        <h2 className="logo">ℜᗰΔ</h2>
                        <li><Link href="/">Home</Link></li>
                        <li><Link href="/hotels">Hotels</Link></li>
                        <li><Link href="/bookings">Bookings</Link></li>
                        <li><Link href="/places">Places</Link></li>
                        <li><Link href="/orders">Orders</Link></li>
                        <li><Link href="/users">Users</Link></li>
                        <li><Link href="/login">login</Link></li>
                        <li><Link href="/signUp">Sign Up</Link></li>
                    </ul>
                )}
            </aside>

            <div className={open ? "main-content" : "main-content main-full"}>
                {children}
            </div>
        </>
    );
}
