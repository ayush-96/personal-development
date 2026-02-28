import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    IconHome,
    IconQuiz,
    IconChat,
    IconDashboard,
    IconCollapse,
    IconPlus,
    IconChevron,
    IconFolder,
    IconFile,
} from '@/components/ui/icons';
// import { useFiles } from "../contexts/FileContext.jsx";

export default function Sidebar({ onToggleCollapse, isCollapsed }) {
    // State for folder expansion
    const [isFolderExpanded, setIsFolderExpanded] = useState(true);
    // const { files, loading } = useFiles();
    const files = [];
    const loading = false;

    const navItems = [
        { name: 'Home', icon: <IconHome />, link: '/' },
        { name: 'Chat to PDF', icon: <IconChat />, link: '/chat' },
        { name: 'Quiz', icon: <IconQuiz />, link: '/quiz/1' },
        { name: 'Dashboard', icon: <IconDashboard />, link: '/dashboard' },
    ];

    return (
        <aside className={`h-screen bg-backgroundLight border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0' : 'w-64'}`}>
            <div className={`h-full flex flex-col p-3 overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                {/* Header */}
                <header className="flex items-center justify-between pb-6 px-1">
                    <h1 className="text-xl font-extrabold text-purple-700 uppercase tracking-wider whitespace-nowrap">
                        LEAP
                    </h1>
                    <button className="p-2 rounded-md hover:bg-gray-100" onClick={onToggleCollapse}>
                        <IconCollapse />
                    </button>
                </header>

                {/* Main Navigation */}
                <nav>
                    <ul>
                        {navItems.map((item) => (
                            <li key={item.name} className="mb-1 py-1">
                                <Link
                                    to={item.link}
                                    className={'group flex items-center p-1 font-light text-sm transition-colors whitespace-nowrap'}
                                >
                                    <span className={'text-gray-500 group-hover:text-purple-700'}>
                                        {item.icon}
                                    </span>
                                    <span className={'ml-1.5 text-gray-700 group-hover:text-purple-700'}>{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Divider */}
                <div className="my-3 mx-1 border-b border-gray-400"></div>

                {/* Spaces Section */}
                <section className="mx-1">
                    <div className="flex items-center justify-between mb-3 py-1">
                        <h2 className="text-sm font-light text-gray-600 whitespace-nowrap">Spaces</h2>
                        <button className=" text-gray-600 hover:text-purple-700">
                            <IconPlus />
                        </button>
                    </div>
                    <ul>
                        <li>
                            <div
                                className={`flex items-center py-2 cursor-pointer rounded-md hover:bg-gray-100 whitespace-nowrap select-none`}
                                onClick={() => setIsFolderExpanded(!isFolderExpanded)}
                            >
                                <IconChevron expanded={isFolderExpanded} />
                                <span className="text-gray-500 ml-1"><IconFolder /></span>
                                <span className="ml-2 text-sm font-light text-gray-800">Untitled Space</span>
                            </div>
                            {isFolderExpanded && (
                                <ul className="pl-3 mt-1">
                                    {loading ? (
                                        <li className="p-2 text-sm text-gray-500">Loading...</li>
                                    ) : files.length > 0 ? (
                                        files.map((file) => (
                                            <li key={file.id}>
                                                <Link to={`/note/${file.id}`} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer w-full select-none">
                                                    <span className="text-gray-500"><IconFile /></span>
                                                    <span className="ml-2 text-sm font-medium text-gray-700 truncate">{file.title}</span>
                                                </Link>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="p-2 text-xs text-gray-500 select-none">No contents in this space</li>
                                    )}
                                </ul>
                            )}
                        </li>
                    </ul>
                </section>

            </div>
        </aside>
    );
};
