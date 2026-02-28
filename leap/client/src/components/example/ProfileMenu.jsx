import React, { useState, useEffect, useRef } from 'react';
import { UserIcon, AdjustmentsIcon, ClockIcon, FolderIcon, UploadIcon, WrenchIcon, MoonIcon, LanguageIcon, LogoutIcon } from '@/components/ui/icons';
import { ChevronRightIcon } from '@heroicons/react/solid';
// import { useUser } from '@/contexts/UserContext';
// import { useNavigate } from 'react-router-dom';


const Icon = ({ children }) => <span className="mr-3 text-gray-500">{children}</span>;


const ProfileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const avatarRef = useRef(null); // Ref for the avatar button
    // const { logout } = useUser();
    const logout = () => {
        console.log('logout');
    };
    // const navigate = useNavigate();
    const navigate = () => {
        console.log('navigate');
    };

    const handleLogout = (event) => {
        event.preventDefault(); // prevent the default behavior of the link
        logout();
        setIsOpen(false);
        // navigate('/login');
    };

    // Effect to handle clicks outside the menu to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            // If the click is on the avatar button, do nothing.
            if (avatarRef.current && avatarRef.current.contains(event.target)) {
                return;
            }
            // If the click is outside the menu, close it.
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const menuItems = [
        { icon: <UserIcon />, label: 'Settings' },
        { icon: <AdjustmentsIcon />, label: 'Personalization' },
        { icon: <ClockIcon />, label: 'History' },
        { icon: <FolderIcon />, label: 'My Library' },
        { icon: <UploadIcon />, label: 'My Uploads' },
        { icon: <WrenchIcon />, label: 'Tools' },
    ];

    const appearanceItems = [
        { icon: <MoonIcon />, label: 'Light/Dark Mode' },
        { icon: <LanguageIcon />, label: 'Change Language' },
    ];

    return (
        <div className="relative">
            {/* Avatar Button */}
            <button
                ref={avatarRef} // Attach the ref to the button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <img
                    className="w-full h-full rounded-full object-cover"
                    src="https://i.pravatar.cc/40?img=1" // Placeholder image
                    alt="User avatar"
                />
            </button>

            {/* Dropdown Menu */}
            <div
                ref={menuRef}
                className={`absolute top-0 right-[calc(100%+0.5rem)] w-64 bg-white rounded-2xl shadow-lg border border-gray-100 p-2 z-10 origin-top-right transition-all duration-200 ease-out ${
                    isOpen
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95 pointer-events-none'
                }`}
            >
                <ul className="space-y-1">
                    {menuItems.map((item) => (
                        <li key={item.label}>
                            <a href="#" className="flex items-center w-full px-3 py-2 text-sm font-light text-gray-700 rounded-lg hover:text-purple-700">
                                <Icon>{item.icon}</Icon>
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>

                <hr className="my-2 border-gray-200" />

                <ul className="space-y-1">
                    {appearanceItems.map((item) => (
                        <li key={item.label}>
                            <a href="#" className="flex items-center justify-between w-full px-3 py-2 text-sm font-light text-gray-700 rounded-lg hover:text-purple-700">
                                <div className="flex items-center">
                                    <Icon>{item.icon}</Icon>
                                    {item.label}
                                </div>
                                {item.hasChevron && <ChevronRightIcon />}
                            </a>
                        </li>
                    ))}
                </ul>

                <hr className="my-2 border-gray-200" />

                <ul>
                    <li>
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2 text-sm font-light text-gray-700 rounded-lg hover:bg-gray-100"
                        >
                            <Icon><LogoutIcon /></Icon>
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default ProfileMenu;