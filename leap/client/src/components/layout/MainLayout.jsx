import { Outlet, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { useSpace } from '@/contexts/SpaceContext';
import { useUser } from '@/contexts/UserContext';
import { MessageSquare, FileQuestion, LayoutDashboard } from 'lucide-react';
import { AnnouncementBar } from '@/components/AnnouncementBar';


export default function Layout() {
    const { currentSpace } = useSpace();
    const {logout, user} = useUser();
    const navigate = useNavigate();

    const chatLink = currentSpace ? `/chat/${currentSpace.id}` : '/chat';
    // Change "Quiz" to "Test Your Knowledge" for students
    const quizName = user?.role === 'student' ? "Test Your Knowledge" : "Quiz";
    const NavItems = [
        { name: "Chat", to: chatLink, icon: <MessageSquare className="h-4 w-4" /> },
        { name: quizName, to: "/quiz", icon: <FileQuestion className="h-4 w-4" /> },
        { name: "Dashboard", to: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    return (
        <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
            <Header navItems={NavItems} onLogout={handleLogout} />
            <AnnouncementBar />
            <main className="flex-1 overflow-y-auto w-full p-4">
                <Outlet />
            </main>
        </div>
    )
}