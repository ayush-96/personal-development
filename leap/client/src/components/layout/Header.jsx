import * as React from "react";
import { NavLink, Link, useLocation } from 'react-router-dom';

import { useUser } from '@/contexts/UserContext';
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { Menu, LayoutDashboard, MessageSquare, FileQuestion, LogOut, User as UserIcon } from "lucide-react";


const defaultNavItems = [
    { name: "Chat", to: "/chat", icon: <MessageSquare className="h-4 w-4" /> },
    { name: "Quiz", to: "/quiz", icon: <FileQuestion className="h-4 w-4" /> },
    { name: "Dashboard", to: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
];

export default function Header({
    navItems = defaultNavItems,
    hideNavOnHome = true,
    onLogout,
}) {
    const { user } = useUser();
    const { pathname } = useLocation();

    const displayName = user?.email || "Guest";
    const initials = (displayName?.trim()?.[0] || "G").toUpperCase();

    const isHome = pathname === "/";

    const linkClass = ({ isActive }) =>
        cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10",
            isActive && "text-primary-foreground bg-primary-foreground/20 font-bold"
        );

    const shouldShowNav = !(hideNavOnHome && isHome);

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-sm">
            <div className="mx-auto flex h-14 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-2">
                    {shouldShowNav && (
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Open menu" className="text-primary-foreground hover:bg-primary-foreground/10">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-72">
                                    <SheetHeader>
                                        <SheetTitle className="text-left">
                                            <Link to="/" className="inline-flex items-center gap-2">
                                                <span className="text-lg font-semibold tracking-tight">LEAP</span>
                                            </Link>
                                        </SheetTitle>
                                    </SheetHeader>

                                    <Separator className="my-4" />

                                    <nav className="flex flex-col gap-1">
                                        {navItems.map((item) => (
                                            <NavLink
                                                key={item.name}
                                                to={item.to}
                                                className={({ isActive }) =>
                                                    cn(
                                                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                        item.disabled
                                                            ? "pointer-events-none opacity-50"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                                                        isActive && !item.disabled && "text-foreground bg-accent"
                                                    )
                                                }
                                            >
                                                {item.icon}
                                                {item.name}
                                            </NavLink>
                                        ))}
                                    </nav>

                                    <Separator className="my-4" />

                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-border">
                                            <AvatarImage src="" alt={displayName} />
                                            <AvatarFallback>{initials}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">{displayName}</div>
                                            <div className="text-xs text-muted-foreground">Signed in</div>
                                        </div>
                                    </div>

                                    {onLogout && (
                                        <Button
                                            variant="outline"
                                            className="mt-4 w-full justify-start"
                                            onClick={onLogout}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Logout
                                        </Button>
                                    )}
                                </SheetContent>
                            </Sheet>
                        </div>
                    )}

                    <Link to="/" className="inline-flex items-center gap-2">
                        <span className="text-lg font-semibold tracking-tight text-primary-foreground">LEAP</span>
                    </Link>
                </div>

                {shouldShowNav && (
                    <nav className="hidden items-center gap-1 md:flex">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.to}
                                className={linkClass}
                                onClick={(e) => {
                                    if (item.disabled) e.preventDefault();
                                }}
                            >
                                {item.icon}
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                )}

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full text-primary-foreground hover:bg-primary-foreground/10" aria-label="User menu">
                                <Avatar className="h-9 w-9 border-2 border-primary-foreground/20">
                                    <AvatarImage src="" alt={displayName} />
                                    <AvatarFallback className="text-primary bg-primary-foreground">{initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="flex flex-col">
                                <span className="text-sm font-medium">Account</span>
                                <span className="truncate text-xs text-muted-foreground">{displayName}</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to="/profile" className="flex items-center" disabled>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {onLogout ? (
                                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem disabled>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
